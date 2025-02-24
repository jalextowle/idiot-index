# Idiot Index

A web application that calculates the "idiot index" of products by comparing their retail price to the cost of their raw materials.

## What is the Idiot Index?

The Idiot Index is a metric that shows how much markup exists between a product's raw material costs and its retail price. A higher index indicates a larger markup.

## Features

- Web scraping of product prices from popular retailers
- Recursive calculation of raw material costs
- Database of product indices
- Modern, responsive web interface

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

## Technology Stack

- Backend: Python Flask
- Frontend: HTML5, CSS3, JavaScript
- Database: SQLite with SQLAlchemy
- Web Scraping: BeautifulSoup4, Selenium
