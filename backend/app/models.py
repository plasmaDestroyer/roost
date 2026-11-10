from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    Index,
    Table,
    func,
    select,
)
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from .database import Base

# Many-to-many: a listing has many amenities, an amenity is on many listings.
listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True)
    avatar_url: Mapped[str] = mapped_column(default="")
    bio: Mapped[str] = mapped_column(default="")
    is_host: Mapped[bool] = mapped_column(default=False)
    is_superhost: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    listings: Mapped[list["Listing"]] = relationship(back_populates="host")


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    icon: Mapped[str]  # lucide icon name, resolved on the frontend


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (CheckConstraint("price_per_night > 0"), CheckConstraint("max_guests > 0"))

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str]
    description: Mapped[str]
    property_type: Mapped[str]  # House, Apartment, Cabin, Villa...
    category: Mapped[str] = mapped_column(index=True)  # slug used by the category bar
    city: Mapped[str] = mapped_column(index=True)
    country: Mapped[str]
    lat: Mapped[float] = mapped_column(default=0)
    lng: Mapped[float] = mapped_column(default=0)
    # ponytail: whole dollars as int; switch to cents if fractional prices are needed
    price_per_night: Mapped[int]
    cleaning_fee: Mapped[int] = mapped_column(default=0)
    max_guests: Mapped[int]
    bedrooms: Mapped[int] = mapped_column(default=1)
    beds: Mapped[int] = mapped_column(default=1)
    baths: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    # Soft delete: the row stays so that guests keep their past trips and reviews.
    is_deleted: Mapped[bool] = mapped_column(default=False)

    host: Mapped[User] = relationship(back_populates="listings")
    photos: Mapped[list["ListingPhoto"]] = relationship(
        order_by="ListingPhoto.position", cascade="all, delete-orphan"
    )
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities)
    reviews: Mapped[list["Review"]] = relationship(
        order_by="Review.created_at.desc()", cascade="all, delete-orphan", back_populates="listing"
    )
    bookings: Mapped[list["Booking"]] = relationship(
        cascade="all, delete-orphan", back_populates="listing"
    )


class ListingPhoto(Base):
    __tablename__ = "listing_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str]
    position: Mapped[int] = mapped_column(default=0)


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in"),
        # The availability query filters on listing + date range.
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    check_in: Mapped[date]
    check_out: Mapped[date]  # exclusive: the guest leaves this morning
    guests: Mapped[int]
    # Price snapshot: later price edits must not change old bookings.
    nightly_price: Mapped[int]
    cleaning_fee: Mapped[int]
    service_fee: Mapped[int]
    total: Mapped[int]
    status: Mapped[str] = mapped_column(default="confirmed")  # confirmed | cancelled
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    listing: Mapped[Listing] = relationship(back_populates="bookings")
    guest: Mapped[User] = relationship()
    review: Mapped["Review | None"] = relationship(back_populates="booking")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # unique: one review per stay. Nullable so seed reviews need no booking.
    booking_id: Mapped[int | None] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), unique=True
    )
    rating: Mapped[int]
    comment: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    listing: Mapped[Listing] = relationship(back_populates="reviews")
    author: Mapped[User] = relationship()
    booking: Mapped[Booking | None] = relationship(back_populates="review")


class Wishlist(Base):
    __tablename__ = "wishlists"
    # Composite primary key: a user can save a listing only once.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(
        ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


# Rating aggregation lives in SQL, so it can never go stale.
Listing.rating = column_property(
    select(func.round(func.avg(Review.rating), 2))
    .where(Review.listing_id == Listing.id)
    .correlate_except(Review)
    .scalar_subquery()
)
Listing.review_count = column_property(
    select(func.count(Review.id))
    .where(Review.listing_id == Listing.id)
    .correlate_except(Review)
    .scalar_subquery()
)
