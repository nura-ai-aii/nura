const { SarvamAIClient } = require('sarvamai');

const client = new SarvamAIClient({
    apiSubscriptionKey: "sk_42hra4is_LHj4zvYb8cWEfmqwgtbOJTR0",
});

console.log('Client keys:', Object.keys(client));
if (client.speechToText) {
    console.log('STT methods:', Object.keys(client.speechToText));
}
