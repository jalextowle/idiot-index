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

# Create database tables
with app.app_context():
    db.create_all()

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
            source_url=data.get('source_url'),
        )
        
        db.session.add(product)
        db.session.commit()

        return jsonify(product.to_dict()), 201

    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/products/<int:parent_id>/components', methods=['POST'])
def add_component(parent_id):
    """Add a component to a product."""
    data = request.json
    try:
        component_id = data['component_id']
        quantity = Decimal(str(data['quantity']))
        unit = data['unit']

        # Check if both products exist
        parent = Product.query.get_or_404(parent_id)
        component = Product.query.get_or_404(component_id)

        # Check for cycles
        if _would_create_cycle(parent_id, component_id):
            return jsonify({'error': 'Adding this component would create a cycle'}), 400

        # Create the relationship
        product_component = ProductComponent(
            parent_product_id=parent_id,
            component_product_id=component_id,
            quantity=quantity,
            unit=unit
        )

        db.session.add(product_component)
        db.session.commit()

        return jsonify(parent.to_dict()), 200

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

@app.route('/api/products/<int:product_id>/component_tree', methods=['GET'])
def get_component_tree(product_id):
    """Get the full component tree for a product."""
    product = Product.query.get_or_404(product_id)
    
    def build_tree(product, quantity=1, unit=None):
        tree = product.to_dict()
        tree['quantity'] = quantity
        tree['unit'] = unit
        
        # Get direct components
        components = []
        for component in product.components:
            component_tree = build_tree(
                component.component,
                component.quantity,
                component.unit
            )
            components.append(component_tree)
        
        tree['components'] = components
        return tree
    
    return jsonify(build_tree(product))

@app.route('/api/products/<int:product_id>/used_in', methods=['GET'])
def get_used_in(product_id):
    """Get all products that use this product as a component."""
    product = Product.query.get_or_404(product_id)
    used_in = []
    
    for usage in product.used_in:
        used_in.append({
            'id': usage.parent_product.id,
            'name': usage.parent_product.name,
            'quantity': float(usage.quantity),
            'unit': usage.unit,
            'idiot_index': float(usage.parent_product.idiot_index) if usage.parent_product.idiot_index else None
        })
    
    return jsonify(used_in)

def _would_create_cycle(parent_id, component_id):
    """Check if adding component_id as a component of parent_id would create a cycle."""
    if parent_id == component_id:
        return True
        
    def get_all_components(product_id, visited=None):
        if visited is None:
            visited = set()
        if product_id in visited:
            return visited
        visited.add(product_id)
        components = ProductComponent.query.filter_by(parent_product_id=product_id).all()
        for component in components:
            get_all_components(component.component_product_id, visited)
        return visited
    
    # If the parent is already a component (direct or indirect) of the component,
    # adding the component as a component of the parent would create a cycle
    return parent_id in get_all_components(component_id)

# Frontend Routes

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/products/new')
def new_product():
    """Render the new product page."""
    return render_template('new_product.html')

@app.route('/products/<int:product_id>')
def product_detail(product_id):
    """Render the product detail page."""
    product = Product.query.get_or_404(product_id)
    return render_template('product_detail.html', product=product)

if __name__ == '__main__':
    app.run(debug=True)
