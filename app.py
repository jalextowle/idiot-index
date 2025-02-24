from flask import Flask, render_template, jsonify, request
from models import db, Product, RawMaterial
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///idiot_index.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/calculate', methods=['POST'])
def calculate_index():
    data = request.json
    url = data.get('url')
    
    # TODO: Implement web scraping and calculation logic
    # This is a placeholder response
    return jsonify({
        'product_name': 'Sample Product',
        'retail_price': 100.00,
        'materials_cost': 20.00,
        'idiot_index': 5.0
    })

@app.route('/api/products')
def get_products():
    products = Product.query.all()
    return jsonify([{
        'name': p.name,
        'retail_price': p.retail_price,
        'materials_cost': p.materials_cost,
        'idiot_index': p.idiot_index
    } for p in products])

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
