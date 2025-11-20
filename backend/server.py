from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import uuid
from pathlib import Path
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-' + str(uuid.uuid4()))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    username: str
    
class UserCreate(UserBase):
    password: str
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str = "user"  # user or admin
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    addresses: List[Dict[str, str]] = []

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    category: str
    stock: int
    images: List[str] = []
    
class ProductCreate(ProductBase):
    pass
    
class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ratings: float = 0.0
    reviews_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryBase(BaseModel):
    name: str
    description: str = ""
    
class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class ReviewBase(BaseModel):
    product_id: str
    rating: int  # 1-5
    comment: str
    
class Review(ReviewBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CartItem(BaseModel):
    product_id: str
    quantity: int
    
class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    items: List[CartItem] = []
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    
class OrderCreate(BaseModel):
    shipping_address: Dict[str, str]
    payment_method: str
    
class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total: float
    status: str = "pending"  # pending, processing, shipped, delivered
    shipping_address: Dict[str, str]
    payment_method: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CouponBase(BaseModel):
    code: str
    discount_percent: float
    valid_until: str
    
class Coupon(CouponBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    active: bool = True

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        role="user"
    )
    user_dict = user.model_dump()
    user_dict["password"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"sub": user.id})
    
    return Token(access_token=token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    token = create_access_token({"sub": user.id})
    
    return Token(access_token=token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin: User = Depends(get_current_admin)):
    product = Product(**product_data.model_dump())
    await db.products.insert_one(product.model_dump())
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, admin: User = Depends(get_current_admin)):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: User = Depends(get_current_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryBase, admin: User = Depends(get_current_admin)):
    category = Category(**category_data.model_dump())
    await db.categories.insert_one(category.model_dump())
    return category

# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart:
        cart = {"user_id": current_user.id, "items": []}
    return cart

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not cart:
        cart = {"user_id": current_user.id, "items": []}
    
    # Update or add item
    item_found = False
    for cart_item in cart["items"]:
        if cart_item["product_id"] == item.product_id:
            cart_item["quantity"] += item.quantity
            item_found = True
            break
    
    if not item_found:
        cart["items"].append(item.model_dump())
    
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": cart},
        upsert=True
    )
    
    return cart

@api_router.post("/cart/update")
async def update_cart_item(item: CartItem, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    for cart_item in cart["items"]:
        if cart_item["product_id"] == item.product_id:
            cart_item["quantity"] = item.quantity
            break
    
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": cart}
    )
    
    return cart

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
    cart["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": cart}
    )
    
    return cart

@api_router.delete("/cart/clear")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart cleared"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    # Get cart
    cart = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Build order items
    order_items = []
    total = 0.0
    
    for cart_item in cart["items"]:
        product = await db.products.find_one({"id": cart_item["product_id"]}, {"_id": 0})
        if product:
            order_item = OrderItem(
                product_id=product["id"],
                product_name=product["name"],
                quantity=cart_item["quantity"],
                price=product["price"]
            )
            order_items.append(order_item)
            total += product["price"] * cart_item["quantity"]
    
    # Create order
    order = Order(
        user_id=current_user.id,
        items=order_items,
        total=total,
        shipping_address=order_data.shipping_address,
        payment_method=order_data.payment_method
    )
    
    await db.orders.insert_one(order.model_dump())
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    else:
        orders = await db.orders.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if current_user.role != "admin" and order["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, admin: User = Depends(get_current_admin)):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ==================== REVIEW ROUTES ====================

@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewBase, current_user: User = Depends(get_current_user)):
    review = Review(
        **review_data.model_dump(),
        user_id=current_user.id,
        username=current_user.username
    )
    
    await db.reviews.insert_one(review.model_dump())
    
    # Update product rating
    reviews = await db.reviews.find({"product_id": review_data.product_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.products.update_one(
        {"id": review_data.product_id},
        {"$set": {"ratings": avg_rating, "reviews_count": len(reviews)}}
    )
    
    return review

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    return reviews

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/users", response_model=List[User])
async def get_users(admin: User = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: User = Depends(get_current_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated"}

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(admin: User = Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    total_revenue = sum(order["total"] for order in orders)
    
    low_stock = await db.products.find({"stock": {"$lt": 10}}, {"_id": 0}).to_list(100)
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "low_stock_products": len(low_stock)
    }

# ==================== COUPONS ====================

@api_router.get("/coupons", response_model=List[Coupon])
async def get_coupons():
    coupons = await db.coupons.find({"active": True}, {"_id": 0}).to_list(100)
    return coupons

@api_router.post("/coupons", response_model=Coupon)
async def create_coupon(coupon_data: CouponBase, admin: User = Depends(get_current_admin)):
    coupon = Coupon(**coupon_data.model_dump())
    await db.coupons.insert_one(coupon.model_dump())
    return coupon

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()