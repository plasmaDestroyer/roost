from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORM):
    id: int
    name: str
    avatar_url: str
    bio: str
    is_host: bool
    is_superhost: bool
    created_at: datetime


class AmenityOut(ORM):
    id: int
    name: str
    icon: str


class PhotoOut(ORM):
    id: int
    url: str


class ReviewOut(ORM):
    id: int
    rating: int
    comment: str
    created_at: datetime
    author: UserOut


class ListingCard(ORM):
    """What the explore grid needs."""

    id: int
    title: str
    property_type: str
    category: str
    city: str
    country: str
    lat: float
    lng: float
    price_per_night: int
    max_guests: int
    bedrooms: int
    beds: int
    baths: int
    rating: float | None
    review_count: int
    photos: list[PhotoOut]
    host: UserOut


class ListingDetail(ListingCard):
    description: str
    cleaning_fee: int
    amenities: list[AmenityOut]
    reviews: list[ReviewOut]


class ListingIn(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10)
    property_type: str
    category: str
    city: str = Field(min_length=1)
    country: str = Field(min_length=1)
    lat: float = 0
    lng: float = 0
    price_per_night: int = Field(gt=0)
    cleaning_fee: int = Field(default=0, ge=0)
    max_guests: int = Field(gt=0)
    bedrooms: int = Field(default=1, ge=0)
    beds: int = Field(default=1, ge=1)
    baths: int = Field(default=1, ge=0)
    photo_urls: list[str] = Field(min_length=1)
    amenity_ids: list[int] = []


class Page(BaseModel):
    items: list[ListingCard]
    total: int
    page: int
    page_size: int


class DateRange(ORM):
    check_in: date
    check_out: date


class Quote(BaseModel):
    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int


class BookingIn(DateRange):
    listing_id: int
    guests: int = Field(gt=0)
    # The total the guest saw at checkout. If the price changed since, the booking is refused.
    expected_total: int | None = None

    @model_validator(mode="after")
    def _dates_in_order(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


class BookingOut(ORM):
    id: int
    check_in: date
    check_out: date
    guests: int
    nightly_price: int
    cleaning_fee: int
    service_fee: int
    total: int
    status: str
    created_at: datetime
    listing: ListingCard
    guest: UserOut
    review: ReviewOut | None


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3)
