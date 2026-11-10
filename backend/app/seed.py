"""Demo data. Runs once, when the users table is empty."""

import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .booking_rules import make_quote
from .models import Amenity, Booking, Listing, ListingPhoto, Review, User, Wishlist

AMENITIES = [  # (name, lucide icon)
    ("Wifi", "wifi"),
    ("Kitchen", "utensils"),
    ("Free parking", "car"),
    ("Pool", "waves"),
    ("Hot tub", "bath"),
    ("Air conditioning", "snowflake"),
    ("Heating", "flame"),
    ("Washer", "shirt"),
    ("TV", "tv"),
    ("Dedicated workspace", "laptop"),
    ("Fireplace", "flame-kindling"),
    ("Beach access", "umbrella"),
    ("Pets allowed", "paw-print"),
    ("Breakfast", "coffee"),
    ("Gym", "dumbbell"),
    ("BBQ grill", "beef"),
]

HOSTS = [  # (name, superhost, bio)
    ("Elena Marchetti", True, "Architect. I restore old houses and share them with travellers."),
    ("Jonas Lindqvist", True, "Outdoor guide. Ask me about trails, lakes and saunas."),
    ("Aiko Tanaka", False, "Designer who loves small, calm spaces."),
    ("Rafael Costa", True, "Surfer and cook. My places are always near water."),
    ("Priya Nair", False, "I host in cities I have lived in. Local tips included."),
    ("Tom Whitaker", False, "Farmer's son. Slow weekends are my speciality."),
]
GUESTS = ["Maya Okafor", "Daniel Roy", "Sofia Alvarez", "Liam Chen"]

# (title, city, country, lat, lng, category, property_type)
PLACES = [
    ("Whitewashed villa above the sea", "Santorini", "Greece", 36.39, 25.46, "beach", "Villa"),
    ("Surf bungalow steps from the sand", "Ericeira", "Portugal", 38.96, -9.42, "beach", "House"),
    ("Palm-shaded beach house", "Tulum", "Mexico", 20.21, -87.46, "beach", "House"),
    ("Clifftop studio with ocean terrace", "Uluwatu", "Indonesia", -8.83, 115.09, "beach", "Apartment"),
    ("A-frame cabin in the pines", "Bend", "United States", 44.06, -121.31, "cabins", "Cabin"),
    ("Log cabin with wood-fired sauna", "Rovaniemi", "Finland", 66.5, 25.73, "cabins", "Cabin"),
    ("Hidden forest cabin by the creek", "Asheville", "United States", 35.6, -82.55, "cabins", "Cabin"),
    ("Black timber cabin with skylight", "Hakuba", "Japan", 36.7, 137.83, "cabins", "Cabin"),
    ("Sunny loft in the old town", "Lisbon", "Portugal", 38.72, -9.14, "city", "Apartment"),
    ("Canal-side apartment with balcony", "Amsterdam", "Netherlands", 52.37, 4.9, "city", "Apartment"),
    ("Minimal flat near Shibuya", "Tokyo", "Japan", 35.66, 139.7, "city", "Apartment"),
    ("Brownstone garden apartment", "New York", "United States", 40.68, -73.97, "city", "Apartment"),
    ("Rooftop studio in the Gothic Quarter", "Barcelona", "Spain", 41.38, 2.18, "city", "Apartment"),
    ("Stone farmhouse among olive trees", "Siena", "Italy", 43.32, 11.33, "countryside", "House"),
    ("Thatched cottage with rose garden", "Cotswolds", "United Kingdom", 51.83, -1.68, "countryside", "Cottage"),
    ("Vineyard guesthouse", "Bordeaux", "France", 44.84, -0.58, "countryside", "House"),
    ("Converted barn with valley views", "Hudson", "United States", 42.25, -73.79, "countryside", "House"),
    ("Jungle villa with infinity pool", "Ubud", "Indonesia", -8.51, 115.26, "pools", "Villa"),
    ("Desert house with plunge pool", "Joshua Tree", "United States", 34.13, -116.31, "pools", "House"),
    ("Hillside villa with heated pool", "Mykonos", "Greece", 37.45, 25.33, "pools", "Villa"),
    ("Modern riad with courtyard pool", "Marrakech", "Morocco", 31.63, -7.99, "pools", "Villa"),
    ("Boathouse on the water", "Lake Como", "Italy", 45.99, 9.26, "lake", "House"),
    ("Glass lake house with private dock", "Lake Tahoe", "United States", 39.1, -120.03, "lake", "House"),
    ("Red cottage by the lake", "Leksand", "Sweden", 60.73, 15.0, "lake", "Cottage"),
    ("Lakeside retreat with canoe", "Queenstown", "New Zealand", -45.03, 168.66, "lake", "House"),
    ("Ski-in chalet with hot tub", "Zermatt", "Switzerland", 46.02, 7.75, "mountains", "Chalet"),
    ("Alpine chalet with fireplace", "Chamonix", "France", 45.92, 6.87, "mountains", "Chalet"),
    ("Mountain lodge above the clouds", "Banff", "Canada", 51.18, -115.57, "mountains", "Chalet"),
    ("Timber hut with glacier view", "Innsbruck", "Austria", 47.27, 11.4, "mountains", "Cabin"),
    ("Tiny house on wheels", "Portland", "United States", 45.52, -122.68, "tiny", "Tiny home"),
    ("Mirror cube in the forest", "Harads", "Sweden", 66.07, 20.98, "tiny", "Tiny home"),
    ("Shepherd's hut under the stars", "Snowdonia", "United Kingdom", 53.07, -3.92, "tiny", "Tiny home"),
]

REVIEW_COMMENTS = [
    (5, "Exactly like the photos. Quiet, clean and the host answered in minutes."),
    (5, "One of the best stays we have had. The view at sunrise is unreal."),
    (5, "Thoughtful details everywhere. We did not want to leave."),
    (4, "Lovely place and great location. The road in is a little steep."),
    (5, "Spotless, comfortable beds, and a kitchen with everything you need."),
    (4, "Very good stay. Check-in was easy. Wifi was slow one evening."),
    (5, "Perfect for a long weekend. We will come back in winter."),
    (3, "Nice space, but street noise started early in the morning."),
    (5, "The host left local tips that made our trip. Highly recommended."),
    (4, "Cozy and well equipped. A little smaller than we expected."),
]


def photo_url(listing_number: int, position: int) -> str:
    # ponytail: keyless stock photos; the seed makes each URL return the same image.
    # They are not house photos. Swap this one function for real uploads or an image API.
    return f"https://picsum.photos/seed/roost-{listing_number}-{position}/1200/800"


def describe(title: str, city: str, property_type: str) -> str:
    return (
        f"{title} — a {property_type.lower()} in {city} made for slow mornings and long evenings.\n\n"
        "The space is bright and carefully furnished, with good linen, a full kitchen and "
        "fast wifi. Everything you need for a short break or a longer stay is here.\n\n"
        f"You are a short walk or drive from the best of {city}: cafés, markets and the "
        "places locals go. A guidebook with our favourite spots is waiting for you."
    )


def add_booking(db, rng, listing, guest, check_in, nights) -> Booking:
    check_out = check_in + timedelta(days=nights)
    quote = make_quote(listing.price_per_night, listing.cleaning_fee, check_in, check_out)
    booking = Booking(
        listing=listing,
        guest=guest,
        check_in=check_in,
        check_out=check_out,
        guests=rng.randint(1, listing.max_guests),
        nightly_price=quote.nightly_price,
        cleaning_fee=quote.cleaning_fee,
        service_fee=quote.service_fee,
        total=quote.total,
    )
    db.add(booking)
    return booking


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(func.count(User.id))):
        return
    rng = random.Random(42)  # fixed seed: same demo data on every machine
    today = date.today()

    amenities = [Amenity(name=name, icon=icon) for name, icon in AMENITIES]
    hosts = [
        User(
            name=name,
            email=f"{name.split()[0].lower()}@roost.test",
            avatar_url=f"https://i.pravatar.cc/150?img={i + 20}",
            bio=bio,
            is_host=True,
            is_superhost=superhost,
        )
        for i, (name, superhost, bio) in enumerate(HOSTS)
    ]
    guests = [
        User(
            name=name,
            email=f"{name.split()[0].lower()}@roost.test",
            avatar_url=f"https://i.pravatar.cc/150?img={i + 40}",
        )
        for i, name in enumerate(GUESTS)
    ]
    db.add_all(amenities + hosts + guests)

    listings = []
    for i, (title, city, country, lat, lng, category, property_type) in enumerate(PLACES):
        bedrooms = 1 if property_type in ("Tiny home", "Apartment") else rng.randint(2, 4)
        listing = Listing(
            host=hosts[i % len(hosts)],
            title=title,
            description=describe(title, city, property_type),
            property_type=property_type,
            category=category,
            city=city,
            country=country,
            lat=lat,
            lng=lng,
            price_per_night=rng.randrange(70, 520, 5),
            cleaning_fee=rng.randrange(20, 90, 5),
            max_guests=bedrooms * 2,
            bedrooms=bedrooms,
            beds=bedrooms + rng.randint(0, 1),
            baths=max(1, bedrooms - 1),
            photos=[ListingPhoto(url=photo_url(i, n), position=n) for n in range(5)],
            amenities=rng.sample(amenities, rng.randint(6, 11)),
        )
        listings.append(listing)

        # Past stays with reviews, plus reviews from other members.
        day = today - timedelta(days=rng.randint(20, 40))
        for _ in range(rng.randint(1, 2)):
            nights = rng.randint(2, 5)
            day -= timedelta(days=nights + rng.randint(3, 30))
            guest = rng.choice(guests)
            stay = add_booking(db, rng, listing, guest, day, nights)
            rating, comment = rng.choice(REVIEW_COMMENTS)
            db.add(Review(listing=listing, author=guest, booking=stay, rating=rating, comment=comment))
        for _ in range(rng.randint(2, 6)):
            rating, comment = rng.choice(REVIEW_COMMENTS)
            db.add(Review(listing=listing, author=rng.choice(guests + hosts), rating=rating, comment=comment))

        # Upcoming stays: these block dates on the calendar.
        day = today + timedelta(days=rng.randint(2, 12))
        for _ in range(rng.randint(0, 3)):
            nights = rng.randint(2, 6)
            add_booking(db, rng, listing, rng.choice(guests[1:]), day, nights)
            day += timedelta(days=nights + rng.randint(1, 14))

    # Demo guest (Maya): one completed stay with no review yet, one upcoming trip, a wishlist.
    maya = guests[0]
    add_booking(db, rng, listings[8], maya, today - timedelta(days=200), 3)
    add_booking(db, rng, listings[21], maya, today + timedelta(days=150), 4)
    db.flush()  # assigns ids, needed for the wishlist rows
    db.add_all(Wishlist(user_id=maya.id, listing_id=listings[n].id) for n in (0, 5, 17))
    db.commit()
