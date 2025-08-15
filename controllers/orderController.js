const Order = require('../models/order');

const createOrder = async (req, res) => {
    try {
        const { items, payment_method, delivery_address } = req.body;
        const user_id = req.userId;
        
        // Calculate total amount
        const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Create order
        const order_id = await Order.create({
            user_id,
            total_amount,
            payment_method,
            delivery_address
        });
        
        // Add order items
        for (const item of items) {
            await Order.addOrderItem(order_id, item.product_id, item.quantity, item.price);
        }
        
        res.status(201).json({ message: 'Order created', order_id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.findByUser(req.userId);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { order_id, status } = req.body;
        await Order.updatePaymentStatus(order_id, status);
        res.json({ message: 'Payment status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    updatePaymentStatus
};
