# server.py
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import joblib
import numpy as np


app = Flask(__name__)

# In-memory user store: { email: {name, password_hash, role} }
users = {}
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role')
    if not all([email, password, name, role]):
        return jsonify({'error': 'Missing fields'}), 400
    if email in users:
        return jsonify({'error': 'User already exists'}), 409
    users[email] = {
        'name': name,
        'password_hash': generate_password_hash(password),
        'role': role
    }
    return jsonify({'message': 'User registered successfully'})

@app.route('/signin', methods=['POST'])
def signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    user = users.get(email)
    if not user or not check_password_hash(user['password_hash'], password) or user['role'] != role:
        return jsonify({'error': 'Invalid credentials'}), 401
    return jsonify({'message': 'Sign in successful', 'name': user['name'], 'role': user['role']})

# Load models
vectorizer = joblib.load('model/vectorizer.joblib')
model = joblib.load('model/classifier.joblib')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    text = data['text']
    
    # Transform and predict
    features = vectorizer.transform([text])
    prediction = model.predict(features)[0]
    confidence = float(model.predict_proba(features)[0].max() * 100)
    
    return jsonify({
        'disease': prediction,
        'confidence': confidence
    })

if __name__ == '__main__':
    app.run(port=5000)