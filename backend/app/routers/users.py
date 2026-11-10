from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import current_user
from ..models import Listing, User, Wishlist
from ..schemas import ListingCard, UserOut

router = APIRouter(tags=["users"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    """Accounts for the mock login menu."""
    return db.scalars(select(User).order_by(User.id)).all()


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.post("/users/me/become-host", response_model=UserOut)
def become_host(user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.is_host = True
    db.commit()
    return user


@router.get("/wishlist", response_model=list[ListingCard])
def my_wishlist(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Listing)
        .join(Wishlist, Wishlist.listing_id == Listing.id)
        .where(Wishlist.user_id == user.id, ~Listing.is_deleted)
        .order_by(Wishlist.created_at.desc())
    ).all()


@router.put("/wishlist/{listing_id}", status_code=204)
def save_listing(listing_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not db.get(Listing, listing_id):
        raise HTTPException(404, "Listing not found")
    # merge = insert if missing, so saving twice is harmless (PUT is idempotent).
    db.merge(Wishlist(user_id=user.id, listing_id=listing_id))
    db.commit()


@router.delete("/wishlist/{listing_id}", status_code=204)
def unsave_listing(listing_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    saved = db.get(Wishlist, (user.id, listing_id))
    if saved:
        db.delete(saved)
        db.commit()
