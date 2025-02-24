from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.hybrid import hybrid_property

db = SQLAlchemy()

class ProductComponent(db.Model):
    """Association table linking products to their components."""
    __tablename__ = 'product_components'
    
    id = db.Column(db.Integer, primary_key=True)
    parent_product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    component_product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Decimal(10, 2), nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    component = db.relationship('Product', foreign_keys=[component_product_id])

class Product(db.Model):
    """
    Represents any product or component in the system.
    Products can be made up of other products (components).
    """
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    retail_price = db.Column(db.Decimal(10, 2), nullable=False)
    is_raw_material = db.Column(db.Boolean, default=False)
    raw_material_cost = db.Column(db.Decimal(10, 2))  # Only set if is_raw_material is True
    source_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    components = db.relationship(
        'ProductComponent',
        foreign_keys=[ProductComponent.parent_product_id],
        backref='parent_product',
        lazy='dynamic'
    )

    used_in = db.relationship(
        'ProductComponent',
        foreign_keys=[ProductComponent.component_product_id],
        backref='component_product',
        lazy='dynamic'
    )

    @hybrid_property
    def materials_cost(self):
        """
        Calculate the total materials cost by summing the costs of all components.
        For raw materials, this is simply their raw_material_cost.
        """
        if self.is_raw_material:
            return self.raw_material_cost or Decimal('0.0')
        
        total_cost = Decimal('0.0')
        for component in self.components:
            # Multiply component's materials cost by quantity
            component_cost = component.component.materials_cost * component.quantity
            total_cost += component_cost
        return total_cost

    @hybrid_property
    def idiot_index(self):
        """Calculate the idiot index as retail_price / materials_cost."""
        if not self.materials_cost or self.materials_cost == 0:
            return None
        return self.retail_price / self.materials_cost

    def to_dict(self):
        """Convert product to dictionary for API responses."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'retail_price': float(self.retail_price),
            'materials_cost': float(self.materials_cost),
            'idiot_index': float(self.idiot_index) if self.idiot_index else None,
            'is_raw_material': self.is_raw_material,
            'raw_material_cost': float(self.raw_material_cost) if self.raw_material_cost else None,
            'source_url': self.source_url,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'components': [{
                'id': pc.component.id,
                'name': pc.component.name,
                'quantity': float(pc.quantity),
                'unit': pc.unit
            } for pc in self.components]
        }
