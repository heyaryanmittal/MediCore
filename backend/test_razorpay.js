require('dotenv').config();
const Razorpay = require('razorpay');

async function test() {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        console.log('Testing with Keys:', process.env.RAZORPAY_KEY_ID);

        const options = {
            amount: 100, // 1 INR
            currency: 'INR',
            receipt: 'test_receipt_1'
        };

        const order = await razorpay.orders.create(options);
        console.log('Order created:', order.id);
    } catch (error) {
        console.error('Test Error:', error.message);
        if (error.error) console.error('Full Error:', JSON.stringify(error.error));
    }
}

test();
