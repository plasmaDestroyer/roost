"""Booking rules check. Run: .venv/bin/python test_bookings.py"""

import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def main():
    with TestClient(app) as client:  # `with` runs startup: tables + seed
        users = client.get("/api/users").json()
        guest = {"X-User-Id": str(next(u["id"] for u in users if not u["is_host"]))}
        host = {"X-User-Id": str(next(u["id"] for u in users if u["is_host"]))}
        listing = client.get("/api/listings").json()["items"][0]

        start = date.today() + timedelta(days=400)  # far from the seeded bookings
        day = lambda n: (start + timedelta(days=n)).isoformat()  # noqa: E731
        book = lambda a, b, headers=guest, guests=1: client.post(  # noqa: E731
            "/api/bookings",
            json={"listing_id": listing["id"], "check_in": day(a), "check_out": day(b), "guests": guests},
            headers=headers,
        )

        first = book(0, 3)
        assert first.status_code == 201, first.text
        nightly = listing["price_per_night"]
        assert first.json()["total"] == nightly * 3 + first.json()["cleaning_fee"] + round(nightly * 3 * 0.14)

        assert book(2, 5).status_code == 409, "overlap must be rejected"
        assert book(-2, 1).status_code == 409, "overlap at the start must be rejected"
        assert book(3, 5).status_code == 201, "check-in on another stay's check-out day is allowed"
        assert book(10, 10).status_code == 422, "zero nights is invalid"
        assert book(20, 22, guests=99).status_code == 400, "too many guests"
        assert book(20, 22, headers={}).status_code == 401, "login required"

        blocked = client.get(f"/api/listings/{listing['id']}/availability").json()
        assert {"check_in": day(0), "check_out": day(3)} in blocked

        # Search with dates must hide the booked listing.
        found = client.get("/api/listings", params={"check_in": day(1), "check_out": day(2), "page_size": 50})
        assert listing["id"] not in [item["id"] for item in found.json()["items"]]

        # A listing with upcoming bookings cannot be deleted (first host owns the first listing).
        assert client.delete(f"/api/listings/{listing['id']}", headers=host).status_code == 409

        # Cancel frees the dates.
        assert client.post(f"/api/bookings/{first.json()['id']}/cancel", headers=guest).status_code == 200
        assert book(0, 3).status_code == 201

        # Two requests for the same free dates at the same time: exactly one wins.
        with ThreadPoolExecutor(8) as pool:
            codes = sorted(r.status_code for r in pool.map(lambda _: book(30, 33), range(8)))
        assert codes == [201] + [409] * 7, codes

        # The price the guest saw must still be the price.
        stale = client.post(
            "/api/bookings",
            json={"listing_id": listing["id"], "check_in": day(40), "check_out": day(42), "guests": 1, "expected_total": 1},
            headers=guest,
        )
        assert stale.status_code == 409, stale.text

        bad_search = client.get("/api/listings", params={"check_in": day(5), "check_out": day(4)})
        assert bad_search.status_code == 400

        # Delete is a soft delete: the listing disappears, the guest's history stays.
        new = client.post(
            "/api/listings",
            json={"title": "Temp place", "description": "A place made by the test", "property_type": "House",
                  "category": "city", "city": "Pune", "country": "India", "price_per_night": 50, "max_guests": 2,
                  "photo_urls": ["https://example.com/a.jpg"]},
            headers=host,
        ).json()
        stay = client.post(
            "/api/bookings",
            json={"listing_id": new["id"], "check_in": day(0), "check_out": day(2), "guests": 1},
            headers=guest,
        ).json()
        assert client.delete(f"/api/listings/{new['id']}", headers=host).status_code == 409
        client.post(f"/api/bookings/{stay['id']}/cancel", headers=guest)
        assert client.delete(f"/api/listings/{new['id']}", headers=host).status_code == 204
        assert client.get(f"/api/listings/{new['id']}").status_code == 404
        assert new["id"] not in [item["id"] for item in client.get("/api/host/listings", headers=host).json()]
        assert stay["id"] in [b["id"] for b in client.get("/api/bookings/mine", headers=guest).json()]

        # Guest vs host.
        assert client.get("/api/host/listings", headers=guest).status_code == 403
        assert client.get("/api/host/listings", headers=host).status_code == 200
        assert client.delete(f"/api/listings/{listing['id']}", headers=guest).status_code == 403
    print("ok")


if __name__ == "__main__":
    main()
