import os
import uuid
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..booking_rules import make_quote, overlaps
from ..database import get_db
from ..deps import require_host
from ..models import Amenity, Booking, Listing, ListingPhoto, User
from ..schemas import AmenityOut, DateRange, ListingCard, ListingDetail, ListingIn, Page, Quote

router = APIRouter(tags=["listings"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))  # point at a persistent volume in production
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def get_listing_or_404(listing_id: int, db: Session) -> Listing:
    listing = db.get(Listing, listing_id)
    if not listing or listing.is_deleted:
        raise HTTPException(404, "Listing not found")
    return listing


def get_owned_listing(listing_id: int, host: User, db: Session) -> Listing:
    listing = get_listing_or_404(listing_id, db)
    if listing.host_id != host.id:
        raise HTTPException(403, "This is not your listing")
    return listing


def apply_listing_data(listing: Listing, data: ListingIn, db: Session) -> None:
    """Copy form data onto a listing. Used by both create and update."""
    for field, value in data.model_dump(exclude={"photo_urls", "amenity_ids"}).items():
        setattr(listing, field, value)
    listing.photos = [ListingPhoto(url=url, position=i) for i, url in enumerate(data.photo_urls)]
    listing.amenities = list(db.scalars(select(Amenity).where(Amenity.id.in_(data.amenity_ids))))


# ---------- public: browse and search ----------


@router.get("/listings", response_model=Page)
def search_listings(
    location: str | None = None,
    check_in: date | None = None,
    check_out: date | None = None,
    guests: int | None = None,
    category: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    bedrooms: int | None = None,
    property_type: list[str] = Query(default=[]),
    amenities: list[int] = Query(default=[]),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    if check_in and check_out and check_out <= check_in:
        raise HTTPException(400, "Check-out must be after check-in")
    query = select(Listing).where(~Listing.is_deleted)
    if location:
        like = f"%{location.strip()}%"
        place = Listing.city + ", " + Listing.country  # matches "Lisbon", "Portugal", "Lisbon, Portugal"
        query = query.where(or_(place.ilike(like), Listing.title.ilike(like)))
    if guests:
        query = query.where(Listing.max_guests >= guests)
    if category:
        query = query.where(Listing.category == category)
    if min_price is not None:
        query = query.where(Listing.price_per_night >= min_price)
    if max_price is not None:
        query = query.where(Listing.price_per_night <= max_price)
    if bedrooms:
        query = query.where(Listing.bedrooms >= bedrooms)
    if property_type:
        query = query.where(Listing.property_type.in_(property_type))
    for amenity_id in amenities:  # listing must have every selected amenity
        query = query.where(Listing.amenities.any(Amenity.id == amenity_id))
    if check_in and check_out:
        # Keep only listings with no confirmed booking in the requested range.
        query = query.where(
            ~exists().where(Booking.listing_id == Listing.id, overlaps(check_in, check_out))
        )

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.options(selectinload(Listing.photos), selectinload(Listing.host))
        .order_by(Listing.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/amenities", response_model=list[AmenityOut])
def list_amenities(db: Session = Depends(get_db)):
    return db.scalars(select(Amenity).order_by(Amenity.id)).all()


@router.get("/listings/{listing_id}", response_model=ListingDetail)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    return get_listing_or_404(listing_id, db)


@router.get("/listings/{listing_id}/availability", response_model=list[DateRange])
def get_booked_ranges(listing_id: int, db: Session = Depends(get_db)):
    """Date ranges the calendar must block."""
    return db.scalars(
        select(Booking).where(
            Booking.listing_id == listing_id,
            Booking.status == "confirmed",
            Booking.check_out > date.today(),
        )
    ).all()


@router.get("/listings/{listing_id}/quote", response_model=Quote)
def get_quote(listing_id: int, check_in: date, check_out: date, db: Session = Depends(get_db)):
    listing = get_listing_or_404(listing_id, db)
    if check_out <= check_in:
        raise HTTPException(400, "Check-out must be after check-in")
    return make_quote(listing.price_per_night, listing.cleaning_fee, check_in, check_out)


# ---------- host: manage own listings ----------


@router.get("/host/listings", response_model=list[ListingCard])
def my_listings(host: User = Depends(require_host), db: Session = Depends(get_db)):
    return db.scalars(select(Listing).where(Listing.host_id == host.id, ~Listing.is_deleted).order_by(Listing.id.desc())).all()


@router.post("/listings", response_model=ListingDetail, status_code=201)
def create_listing(data: ListingIn, host: User = Depends(require_host), db: Session = Depends(get_db)):
    listing = Listing(host_id=host.id)
    apply_listing_data(listing, data, db)
    db.add(listing)
    db.commit()
    return listing


@router.put("/listings/{listing_id}", response_model=ListingDetail)
def update_listing(
    listing_id: int, data: ListingIn, host: User = Depends(require_host), db: Session = Depends(get_db)
):
    listing = get_owned_listing(listing_id, host, db)
    apply_listing_data(listing, data, db)
    db.commit()
    return listing


@router.delete("/listings/{listing_id}", status_code=204)
def delete_listing(listing_id: int, host: User = Depends(require_host), db: Session = Depends(get_db)):
    listing = get_owned_listing(listing_id, host, db)
    has_upcoming = db.scalar(
        select(exists().where(Booking.listing_id == listing_id, overlaps(date.today(), date.max)))
    )
    if has_upcoming:
        # Guests with confirmed trips must not lose them silently.
        raise HTTPException(409, "This listing has upcoming bookings. Cancel them first.")
    listing.is_deleted = True  # hidden everywhere; past bookings and reviews stay
    db.commit()


@router.post("/uploads")
async def upload_photo(file: UploadFile, _: User = Depends(require_host)):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(400, "Only image files are allowed")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "Image must be 5 MB or smaller")
    # Random name: never trust a client file name on disk.
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}:
        suffix = ".jpg"
    name = f"{uuid.uuid4().hex}{suffix}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / name).write_bytes(content)
    # ponytail: local disk. On a host with no persistent disk, swap for S3/Cloudinary here.
    return {"url": f"/uploads/{name}"}
