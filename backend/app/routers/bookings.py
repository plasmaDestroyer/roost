import threading
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from ..booking_rules import make_quote, overlaps
from ..database import get_db
from ..deps import current_user, require_host
from ..models import Booking, Listing, Review, User
from ..schemas import BookingIn, BookingOut, ReviewIn, ReviewOut

router = APIRouter(tags=["bookings"])
booking_lock = threading.Lock()


@router.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking(data: BookingIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    listing = db.get(Listing, data.listing_id)
    if not listing or listing.is_deleted:
        raise HTTPException(404, "Listing not found")
    if listing.host_id == user.id:
        raise HTTPException(400, "You cannot book your own listing")
    if data.check_in < date.today():
        raise HTTPException(400, "Check-in cannot be in the past")
    if data.guests > listing.max_guests:
        raise HTTPException(400, f"This place allows at most {listing.max_guests} guests")

    quote = make_quote(listing.price_per_night, listing.cleaning_fee, data.check_in, data.check_out)
    if data.expected_total is not None and data.expected_total != quote.total:
        raise HTTPException(409, "The price changed. Check the new total and confirm again.")

    # Two requests for the same dates could both pass the check before either one inserts.
    # ponytail: one lock for all bookings, correct for one server process. With several
    # processes or Postgres, use an exclusion constraint on (listing_id, date range).
    with booking_lock:
        taken = db.scalar(
            select(exists().where(Booking.listing_id == listing.id, overlaps(data.check_in, data.check_out)))
        )
        if taken:
            raise HTTPException(409, "Those dates are no longer available")
        booking = Booking(
            listing_id=listing.id,
            guest_id=user.id,
            check_in=data.check_in,
            check_out=data.check_out,
            guests=data.guests,
            nightly_price=quote.nightly_price,
            cleaning_fee=quote.cleaning_fee,
            service_fee=quote.service_fee,
            total=quote.total,
        )
        db.add(booking)
        db.commit()
    return booking


@router.get("/bookings/mine", response_model=list[BookingOut])
def my_trips(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Booking).where(Booking.guest_id == user.id).order_by(Booking.check_in.desc())
    ).all()


@router.get("/host/bookings", response_model=list[BookingOut])
def bookings_on_my_listings(host: User = Depends(require_host), db: Session = Depends(get_db)):
    return db.scalars(
        select(Booking).join(Listing).where(Listing.host_id == host.id).order_by(Booking.check_in.desc())
    ).all()


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    # Both the guest and the host of the listing can cancel.
    if not booking or user.id not in (booking.guest_id, booking.listing.host_id):
        raise HTTPException(404, "Booking not found")
    if booking.check_in <= date.today():
        raise HTTPException(400, "This stay has already started")
    booking.status = "cancelled"  # the dates become free again: overlaps() ignores cancelled
    db.commit()
    return booking


@router.post("/bookings/{booking_id}/review", response_model=ReviewOut, status_code=201)
def review_stay(
    booking_id: int, data: ReviewIn, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    booking = db.get(Booking, booking_id)
    if not booking or booking.guest_id != user.id:
        raise HTTPException(404, "Booking not found")
    if booking.status != "confirmed" or booking.check_out > date.today():
        raise HTTPException(400, "You can review a stay only after it is completed")
    if booking.review:
        raise HTTPException(409, "You already reviewed this stay")
    review = Review(
        listing_id=booking.listing_id,
        author_id=user.id,
        booking_id=booking.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    return review
