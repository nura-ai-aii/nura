const { SarvamAI } = require('sarvamai');

const client = new SarvamAI({
    apiSubscriptionKey: "sk_42hra4is_LHj4zvYb8cWEfmqwgtbOJTR0",
});

console.log('Client initialized:', Object.keys(client));
console.log('STT methods:', client.speechToText ? Object.keys(client.speechToText) : 'No STT');
