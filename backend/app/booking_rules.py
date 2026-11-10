"""The rules of booking: when dates collide, and what a stay costs."""

from datetime import date

from sqlalchemy import and_

from .models import Booking
from .schemas import Quote

SERVICE_FEE_RATE = 0.14


def overlaps(check_in: date, check_out: date):
    """SQL condition: a confirmed booking that collides with [check_in, check_out).

    Two ranges collide when each one starts before the other ends. check_out is
    exclusive, so a stay can start on the day another one ends.
    """
    return and_(
        Booking.status == "confirmed",
        Booking.check_in < check_out,
        Booking.check_out > check_in,
    )


def make_quote(nightly_price: int, cleaning_fee: int, check_in: date, check_out: date) -> Quote:
    """Single source of truth for the price breakdown (detail page, checkout, booking)."""
    nights = (check_out - check_in).days
    subtotal = nightly_price * nights
    service_fee = round(subtotal * SERVICE_FEE_RATE)
    return Quote(
        nights=nights,
        nightly_price=nightly_price,
        subtotal=subtotal,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total=subtotal + cleaning_fee + service_fee,
    )
