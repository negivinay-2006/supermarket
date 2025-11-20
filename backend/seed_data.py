import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["supermarket_db"]
    
    print("Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.products.delete_many({})
    await db.categories.delete_many({})
    
    # Create admin user
    admin = {
        "id": str(uuid.uuid4()),
        "email": "admin@supermarket.com",
        "username": "Admin",
        "password": pwd_context.hash("admin123"),
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "addresses": []
    }
    await db.users.insert_one(admin)
    print(f"✓ Admin user created: admin@supermarket.com / admin123")
    
    # Create test user
    user = {
        "id": str(uuid.uuid4()),
        "email": "user@test.com",
        "username": "Test User",
        "password": pwd_context.hash("user123"),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "addresses": []
    }
    await db.users.insert_one(user)
    print(f"✓ Test user created: user@test.com / user123")
    
    # Create categories
    categories = [
        {"id": str(uuid.uuid4()), "name": "Groceries", "description": "Fresh groceries and daily essentials"},
        {"id": str(uuid.uuid4()), "name": "Electronics", "description": "Latest electronic gadgets"},
        {"id": str(uuid.uuid4()), "name": "Clothing", "description": "Fashion and apparel"},
        {"id": str(uuid.uuid4()), "name": "Home & Kitchen", "description": "Home essentials and kitchen items"},
        {"id": str(uuid.uuid4()), "name": "Beauty", "description": "Beauty and personal care products"},
    ]
    await db.categories.insert_many(categories)
    print(f"✓ {len(categories)} categories created")
    
    # Create sample products
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Organic Bananas",
            "description": "Fresh organic bananas, perfect for snacking",
            "price": 250,
            "category": "Groceries",
            "stock": 150,
            "images": ["https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400"],
            "ratings": 4.5,
            "reviews_count": 12,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Whole Wheat Bread",
            "description": "Healthy whole wheat bread, freshly baked",
            "price": 3.49,
            "category": "Groceries",
            "stock": 80,
            "images": ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"],
            "ratings": 4.7,
            "reviews_count": 23,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Organic Milk 1L",
            "description": "Fresh organic milk from grass-fed cows",
            "price": 415,
            "category": "Groceries",
            "stock": 60,
            "images": ["https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400"],
            "ratings": 4.8,
            "reviews_count": 45,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Fresh Strawberries",
            "description": "Sweet and juicy strawberries",
            "price": 5.99,
            "category": "Groceries",
            "stock": 40,
            "images": ["https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400"],
            "ratings": 4.6,
            "reviews_count": 18,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Wireless Headphones",
            "description": "Premium wireless headphones with noise cancellation",
            "price": 7483,
            "category": "Electronics",
            "stock": 25,
            "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
            "ratings": 4.9,
            "reviews_count": 67,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Smart Watch",
            "description": "Feature-rich smartwatch with health tracking",
            "price": 199.99,
            "category": "Electronics",
            "stock": 15,
            "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"],
            "ratings": 4.7,
            "reviews_count": 89,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Bluetooth Speaker",
            "description": "Portable waterproof bluetooth speaker",
            "price": 4158,
            "category": "Electronics",
            "stock": 5,
            "images": ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"],
            "ratings": 4.4,
            "reviews_count": 34,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Cotton T-Shirt",
            "description": "Comfortable cotton t-shirt, available in multiple colors",
            "price": 19.99,
            "category": "Clothing",
            "stock": 100,
            "images": ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"],
            "ratings": 4.3,
            "reviews_count": 56,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Denim Jeans",
            "description": "Classic fit denim jeans",
            "price": 4158,
            "category": "Clothing",
            "stock": 75,
            "images": ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"],
            "ratings": 4.6,
            "reviews_count": 78,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Coffee Maker",
            "description": "Programmable coffee maker with thermal carafe",
            "price": 79.99,
            "category": "Home & Kitchen",
            "stock": 30,
            "images": ["https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400"],
            "ratings": 4.8,
            "reviews_count": 92,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Non-Stick Pan Set",
            "description": "3-piece non-stick pan set",
            "price": 3328,
            "category": "Home & Kitchen",
            "stock": 45,
            "images": ["https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400"],
            "ratings": 4.5,
            "reviews_count": 41,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Face Moisturizer",
            "description": "Hydrating face moisturizer with SPF 30",
            "price": 24.99,
            "category": "Beauty",
            "stock": 65,
            "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400"],
            "ratings": 4.7,
            "reviews_count": 103,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    await db.products.insert_many(products)
    print(f"✓ {len(products)} products created")
    
    print("\n✅ Database seeded successfully!")
    print("\nLogin credentials:")
    print("  Admin: admin@supermarket.com / admin123")
    print("  User:  user@test.com / user123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())