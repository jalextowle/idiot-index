from flask import Flask, render_template, jsonify, request, abort
from models import db, Product, ProductComponent
from decimal import Decimal
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///idiot_index.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# API Routes

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products with their idiot indices."""
    products = Product.query.all()
    return jsonify([product.to_dict() for product in products])

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get detailed information about a specific product."""
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())

@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product."""
    data = request.json
    
    try:
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            retail_price=Decimal(str(data['retail_price'])),
            is_raw_material=data.get('is_raw_material', False),
            source_url=data.get('source_url'),
        )
        
        if product.is_raw_material:
            if 'raw_material_cost' not in data:
                return jsonify({'error': 'raw_material_cost is required for raw materials'}), 400
            product.raw_material_cost = Decimal(str(data['raw_material_cost']))
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify(product.to_dict()), 201
        
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/products/<int:product_id>/components', methods=['POST'])
def add_component():
    """Add a component to a product."""
    parent_product = Product.query.get_or_404(request.view_args['product_id'])
    data = request.json
    
    try:
        component_product = Product.query.get_or_404(data['component_id'])
        
        # Prevent adding raw materials as parents
        if parent_product.is_raw_material:
            return jsonify({'error': 'Cannot add components to a raw material'}), 400
            
        # Prevent cycles in the product graph
        if _would_create_cycle(parent_product.id, component_product.id):
            return jsonify({'error': 'Adding this component would create a cycle'}), 400
        
        component = ProductComponent(
            parent_product=parent_product,
            component=component_product,
            quantity=Decimal(str(data['quantity'])),
            unit=data['unit']
        )
        
        db.session.add(component)
        db.session.commit()
        
        return jsonify(parent_product.to_dict()), 200
        
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/products/<int:product_id>/components/<int:component_id>', methods=['DELETE'])
def remove_component(product_id, component_id):
    """Remove a component from a product."""
    component = ProductComponent.query.filter_by(
        parent_product_id=product_id,
        component_product_id=component_id
    ).first_or_404()
    
    db.session.delete(component)
    db.session.commit()
    
    return '', 204

def _would_create_cycle(parent_id, component_id):
    """Check if adding component_id as a component of parent_id would create a cycle."""
    if parent_id == component_id:
        return True
        
    # Get all products that the component is used in
    def get_ancestors(product_id, visited=None):
        if visited is None:
            visited = set()
        
        if product_id in visited:
            return visited
            
        visited.add(product_id)
        product = Product.query.get(product_id)
        
        for usage in product.used_in:
            get_ancestors(usage.parent_product_id, visited)
            
        return visited
    
    # If the parent is already in the component's ancestor tree, adding the component
    # would create a cycle
    return parent_id in get_ancestors(component_id)

# Frontend Routes

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/products/<int:product_id>')
def product_detail(product_id):
    """Render the product detail page."""
    product = Product.query.get_or_404(product_id)
    return render_template('product_detail.html', product=product)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
