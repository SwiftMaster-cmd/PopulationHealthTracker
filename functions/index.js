const functions = require('firebase-functions');
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;

// Set up Vertex AI client
const client = new PredictionServiceClient();

exports.generateContent = functions.https.onCall(async (data, context) => {
    const prompt = data.prompt;

    const project = 'YOUR_PROJECT_ID';
    const endpointId = 'YOUR_ENDPOINT_ID'; // Replace with your endpoint ID
    const location = 'us-central1'; // Replace with your location if different

    const endpoint = `projects/${project}/locations/${location}/endpoints/${endpointId}`;

    const request = {
        endpoint: endpoint,
        instances: [{ content: prompt }],
        parameters: {},
    };

    const [response] = await client.predict(request);

    return { response: response.predictions[0].content };
});