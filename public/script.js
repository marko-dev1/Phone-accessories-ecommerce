let products = [];
let deals = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const productRow = document.getElementById('productRow');
const dealsRow = document.getElementById('dealsRow');
const cartModal = document.getElementById('cartModal');
const cartIcon = document.getElementById('cartIcon');
const closeModal = document.getElementById('closeModal');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const checkoutBtn = document.getElementById('checkoutBtn');

// Initialize the store
async function initStore() {
    showLoading(productRow);
    showLoading(dealsRow);
    
    try {
        await fetchProducts();
        setupEventListeners();
        updateCart();
    } catch (error) {
        console.error('Store initialization failed:', error);
        showError(productRow, 'Failed to load products');
        showError(dealsRow, 'Failed to load deals');
    }
}

// Show loading spinner
function showLoading(element) {
    element.innerHTML = '<div class="loading-spinner"></div>';
}

// Show error message
function showError(element, message) {
    element.innerHTML = `
        <div class="error-message">
            ${message}
            <button onclick="location.reload()">Retry</button>
        </div>
    `;
}

// Fetch products from database
async function fetchProducts() {
    try {
        const response = await fetch('/api/products?t=' + Date.now());
        if (!response.ok) throw new Error('Network response was not ok');
        
        products = await response.json();
        
        // Create deals (first 4 products with 20% discount)
        deals = products.slice(0, 5).map(product => ({
            ...product,
            price: Math.round(product.price * 0.8),
            oldPrice: product.price
        }));
        
        renderProducts();
        renderDeals();
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

// Render products
function renderProducts() {
    if (products.length === 0) {
        productRow.innerHTML = '<p class="no-products">No products available</p>';
        return;
    }
    
    productRow.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <img src="${product.image_url || product.image || '/img/placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-img"
                 loading="lazy"
                 onerror="this.src='/img/placeholder.jpg'">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3>${product.name}</h3>
                <div class="price">
                    Ksh ${product.price.toLocaleString()} 
                    ${product.old_price || product.oldPrice ? 
                      `<span class="old-price">Ksh ${(product.old_price || product.oldPrice).toLocaleString()}</span>` : ''}
                </div>
                <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Render deals
function renderDeals() {
    if (deals.length === 0) {
        dealsRow.innerHTML = '<p class="no-products">No deals available</p>';
        return;
    }
    
    dealsRow.innerHTML = deals.map(product => `
        <div class="product-card" data-id="${product.id}">
            <span class="product-badge">HOT DEAL</span>
            <img src="${product.image_url || product.image || '/img/placeholder.jpg'}" 
                 alt="${product.name}" 
                 class="product-img"
                 loading="lazy"
                 onerror="this.src='/img/placeholder.jpg'">
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3>${product.name}</h3>
                <div class="price">
                    Ksh ${product.price.toLocaleString()} 
                    <span class="old-price">Ksh ${product.oldPrice.toLocaleString()}</span>
                </div>
                <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

// Event delegation setup
function setupEventListeners() {
    // Add to cart using event delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = parseInt(e.target.getAttribute('data-id'));
            addToCart(productId);
        }
    });
    
    // Cart icon click
    cartIcon.addEventListener('click', function(e) {
        e.preventDefault();
        cartModal.style.display = 'block';
    });
    
    // Close modal
    closeModal.addEventListener('click', function() {
        cartModal.style.display = 'none';
    });
    
    // Checkout button - now only processes via WhatsApp
    checkoutBtn.addEventListener('click', function() {
        if (cart.length > 0) {
            completeOrderViaWhatsApp();
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
    
    // Cart event delegation
    cartItems.addEventListener('click', handleCartClick);
    cartItems.addEventListener('change', handleCartChange);
}

// Handle cart interactions
function handleCartClick(e) {
    const cartItem = e.target.closest('.cart-item');
    if (!cartItem) return;
    
    const productId = parseInt(cartItem.getAttribute('data-id'));
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    if (e.target.classList.contains('decrease')) {
        if (item.quantity > 1) {
            item.quantity -= 1;
            updateCart();
        }
    } 
    else if (e.target.classList.contains('increase')) {
        item.quantity += 1;
        updateCart();
    }
    else if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
        cart = cart.filter(item => item.id !== productId);
        updateCart();
    }
}

function handleCartChange(e) {
    if (e.target.classList.contains('quantity-input')) {
        const cartItem = e.target.closest('.cart-item');
        const productId = parseInt(cartItem.getAttribute('data-id'));
        const item = cart.find(item => item.id === productId);
        const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
        
        item.quantity = newQuantity;
        updateCart();
    }
}

function addToCart(productId) {
    const product = [...deals, ...products].find(p => p.id == productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url || product.image || '/img/placeholder.jpg',
                quantity: 1
            });
        }
        
        updateCart();
        showToast(`${product.name} added to cart`);
    } else {
        console.error(`Product with ID ${productId} not found`);
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    cartCount.textContent = totalItems;
    
    if (cart.length > 0) {
        emptyCartMessage.style.display = 'none';
        cartItems.innerHTML = cart.map(item => {
            const price = item.price || 0;
            return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image || '/img/placeholder.jpg'}" 
                     alt="${item.name || 'Product'}" 
                     class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name || 'Unknown Product'}</div>
                    <div class="cart-item-price">Ksh ${price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease">-</button>
                        <input type="number" value="${item.quantity}" min="1" class="quantity-input">
                        <button class="quantity-btn increase">+</button>
                        <button class="remove-item"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } else {
        emptyCartMessage.style.display = 'block';
        cartItems.innerHTML = '';
    }
    
    const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    cartTotal.textContent = `Ksh ${total.toLocaleString()}`;
}




function completeOrderViaWhatsApp() {
    if (cart.length === 0) {
        alert("Your cart is empty. Please add items before checkout.");
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create modal for customer details
    const detailsModal = document.createElement('div');
    detailsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, rgba(212, 177, 177, 0.8), rgba(132, 78, 78, 0.9));
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
    `;

    detailsModal.innerHTML = `
        <div style="background: #222; border-radius: 10px; padding: 20px; max-width: 500px; width: 90%;">
            <h2 style="color: #25D366; text-align: center;">Complete Your Order</h2>
            
            <form id="orderDetailsForm">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Full Name</label>
                    <input type="text" id="fullName" required 
                           style="width: 100%; padding: 10px; border-radius: 5px; border: none;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Delivery Address</label>
                    <input type="text" id="deliveryAddress" required 
                           style="width: 100%; padding: 10px; border-radius: 5px; border: none;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px;">WhatsApp Number</label>
                    <input type="tel" id="whatsappNumber" required 
                           placeholder="2547XXXXXXXX" 
                           style="width: 100%; padding: 10px; border-radius: 5px; border: none;">
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" 
                            style="flex: 1; padding: 12px; background: #25D366; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer;">
                        Continue to WhatsApp
                    </button>
                    <button type="button" onclick="closeDetailsModal()" 
                            style="flex: 1; padding: 12px; background: #555; color: white; 
                                   border: none; border-radius: 5px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(detailsModal);
    document.body.style.overflow = 'hidden';

    // Handle form submission
    detailsModal.querySelector('#orderDetailsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
        let whatsappNumber = document.getElementById('whatsappNumber').value.trim();
        
        // Validate WhatsApp number
        whatsappNumber = whatsappNumber.replace(/\D/g, '');
        if (whatsappNumber.startsWith("0")) {
            whatsappNumber = "254" + whatsappNumber.substring(1);
        } else if (whatsappNumber.startsWith("7")) {
            whatsappNumber = "254" + whatsappNumber;
        }
        
        if (!/^2547\d{8}$/.test(whatsappNumber)) {
            alert("Please enter a valid Kenyan WhatsApp number (e.g., 07XXXXXXXX or 2547XXXXXXXX)");
            return;
        }
        
        // Prepare order data
        const order = {
            id: "ORD" + Date.now().toString().slice(-6),
            date: new Date().toLocaleString(),
            paymentMethod: "WhatsApp Order",
            subtotal: total,
            deliveryFee: 100,
            finalTotal: total + 100,
            items: [...cart], // Copy cart items
            user: {
                fullName: fullName,
                phone: whatsappNumber,
                deliveryAddress: deliveryAddress
            }
        };
        
        // Close details modal
        closeDetailsModal();
        
        // Generate WhatsApp order
        generateWhatsAppOrder(order);
    });

    function closeDetailsModal() {
        document.body.removeChild(detailsModal);
        document.body.style.overflow = '';
    }
    
    window.closeDetailsModal = closeDetailsModal;
}

function generateWhatsAppOrder(order) {
    // Create the WhatsApp message with your existing format
    const message = `
 *NEW ORDER ALERT- VITRONICS HUB*   

        *ORDER SUMMARY*
        Order #: ${order.id.padEnd(16)} 
        Date: ${order.date.padEnd(19)}


        *ITEMS ORDERED*
${order.items.map(item => 
`${item.name}
Quantity: ${item.quantity}
Price: Ksh ${(item.price * item.quantity).toLocaleString().padStart(8)}`
).join('\n')}

*PAYMENT SUMMARY*
Subtotal: Ksh ${order.subtotal.toLocaleString().padStart(12)} 
Delivery: Ksh ${order.deliveryFee.toLocaleString().padStart(12)} 
TOTAL: Ksh ${order.finalTotal.toLocaleString().padStart(15)}

*CUSTOMER DETAILS*
Name: ${order.user.fullName.padEnd(22)} 
Phone: ${order.user.phone.padEnd(21)} 
Address: ${order.user.deliveryAddress.padEnd(19)} 

📞 Call/WhatsApp for assistance: +254 703 182530
    `.trim();

    // Create the modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        // background: rgba(204, 196, 196, 0.9);
         background: linear-gradient(to bottom, rgba(212, 177, 177, 0.8), rgba(132, 78, 78, 0.9));
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #222; border-radius: 10px; padding: 20px; max-width: 500px; width: 90%;">
            <h2 style="color: #25D366; text-align: center;">Your Order is Ready</h2>
            
            <div style="margin: 15px 0; text-align: center;">
                <p>Click the button below to send your order via WhatsApp</p>
            </div>
            
            <a href="https://wa.me/254703182530?text=${encodeURIComponent(message)}" 
               target="_blank"
               style="display: block;
                      background: #25D366;
                      color: white;
                      text-align: center;
                      padding: 15px;
                      border-radius: 8px;
                      text-decoration: none;
                      font-weight: bold;
                      margin: 15px 0;">
                🚀 Send via WhatsApp
            </a>
            
            <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin-top: 0;">Alternative options:</p>
                <ol style="padding-left: 20px; margin-bottom: 15px;">
                    <li>Open WhatsApp manually</li>
                    <li>Message to: +254 703 182530</li>
                    <li>Copy the order details below</li>
                </ol>
                
                <textarea id="orderMessage" 
                          style="width: 100%;
                                 height: 200px;
                                 padding: 10px;
                                 margin-bottom: 10px;
                                 border-radius: 5px;
                                 background: #444;
                                 color: white;
                                 border: 1px solid #666;"
                          readonly>${message}</textarea>
                
                <button id="copyButton"
                        style="width: 100%;
                               padding: 10px;
                               background: #555;
                               color: white;
                               border: none;
                               border-radius: 5px;
                               cursor: pointer;">
                    📋 Copy Order Details
                </button>
            </div>
            
            <button id="closeButton"
                    style="width: 100%;
                           padding: 10px;
                           background: #f14848ff;
                           color: white;
                           border: none;
                           border-radius: 5px;
                           cursor: pointer;" >
                                                  
               
                Cancel Your Order
            </button>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Add event listeners directly (better than using global functions)
    modal.querySelector('#copyButton').addEventListener('click', function() {
        const textarea = document.getElementById('orderMessage');
        textarea.select();
        document.execCommand('copy');
        
        // Visual feedback
        const copyBtn = modal.querySelector('#copyButton');
        copyBtn.textContent = '✓ Copied!';
        copyBtn.style.background = '#25D366';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copy Order Details';
            copyBtn.style.background = '#555';
        }, 2000);
    });

    modal.querySelector('#closeButton').addEventListener('click', function() {
        // Close the modal
        document.body.removeChild(modal);
        document.body.style.overflow = '';
        
        // Clear the cart
        cart = [];
        updateCart();
        
        // Close the cart modal if open
        if (cartModal) {
            cartModal.style.display = 'none';
        }
        
        // Show confirmation (optional)
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f42b2bff;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: fadeInOut 3s forwards;
        `;
        
        confirmation.innerHTML = `your Order #${order.id} Has been Cancelled!`;
        document.body.appendChild(confirmation);
        
        // Add CSS for animation
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fadeInOut {
                0% { opacity: 0; top: 10px; }
                10% { opacity: 1; top: 20px; }
                90% { opacity: 1; top: 20px; }
                100% { opacity: 0; top: 10px; }
            }
        `;
        document.head.appendChild(style);
        
        // Remove after animation
        setTimeout(() => {
            document.body.removeChild(confirmation);
            document.head.removeChild(style);
        }, 3000);
    });
}
    // Reset cart


// Initialize the store when DOM is loaded
document.addEventListener('DOMContentLoaded', initStore);
