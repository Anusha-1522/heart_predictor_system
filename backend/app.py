from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
# Update CORS to allow requests from frontend
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Patient database
PATIENTS_FILE = 'patients.json'

def load_patients():
    try:
        if os.path.exists(PATIENTS_FILE):
            with open(PATIENTS_FILE, 'r') as f:
                content = f.read().strip()
                if content:  # Check if file is not empty
                    return json.loads(content)
        return []
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error loading patients file: {e}")
        return []

def save_patients(patients):
    try:
        with open(PATIENTS_FILE, 'w') as f:
            json.dump(patients, f, indent=2)
    except Exception as e:
        print(f"Error saving patients: {e}")

# Initialize with sample data
patients_db = load_patients()
if not patients_db:
    print("Initializing with sample patient data...")
    patients_db = [
        {
            "id": 1, "name": "Sarah Johnson", "age": 45, "gender": "female",
            "heart_rate": 72, "blood_pressure": "120/80", "cholesterol": 180,
            "condition": "Normal", "risk_level": "Low", "risk_score": 25,
            "last_checkup": "2024-01-15"
        },
        {
            "id": 2, "name": "Michael Chen", "age": 62, "gender": "male",
            "heart_rate": 85, "blood_pressure": "145/95", "cholesterol": 240,
            "condition": "Hypertension", "risk_level": "High", "risk_score": 78,
            "last_checkup": "2024-01-10"
        },
        {
            "id": 3, "name": "Robert Williams", "age": 58, "gender": "male",
            "heart_rate": 78, "blood_pressure": "135/85", "cholesterol": 220,
            "condition": "High Cholesterol", "risk_level": "High", "risk_score": 82,
            "last_checkup": "2024-01-12"
        }
    ]
    save_patients(patients_db)

# Enhanced Heart Disease Prediction
def predict_heart_disease(data):
    score = 0
    
    # Age factor
    age = data.get('age', 0)
    if age > 60: score += 25
    elif age > 50: score += 15
    elif age > 40: score += 10
    
    # Gender
    if data.get('gender') == 'male': score += 10
    
    # Chest pain type
    chest_pain = data.get('chest_pain', '')
    if chest_pain in ['atypical angina', 'non-anginal pain']: score += 15
    elif chest_pain == 'asymptomatic': score += 25
    
    # Blood pressure
    if data.get('trestbps', 0) > 140: score += 15
    
    # Cholesterol
    chol = data.get('chol', 0)
    if chol > 240: score += 20
    elif chol > 200: score += 10
    
    # Fasting blood sugar
    if data.get('fbs') == 1: score += 10
    
    # Resting ECG
    restecg = data.get('restecg', 0)
    if restecg == 1: score += 5
    elif restecg == 2: score += 10
    
    # Maximum heart rate
    thalach = data.get('thalach', 0)
    if thalach < 120: score += 20
    elif thalach < 140: score += 10
    
    # Exercise induced angina
    if data.get('exang') == 1: score += 15
    
    # ST Depression
    oldpeak = data.get('oldpeak', 0)
    if oldpeak > 2.0: score += 30
    elif oldpeak > 1.0: score += 20
    
    # Slope
    slope = data.get('slope', 1)
    if slope == 3: score += 10  # Downsloping
    elif slope == 2: score += 5  # Flat
    
    # Number of major vessels
    ca = data.get('ca', 0)
    score += ca * 10
    
    # Thalassemia
    thal = data.get('thal', 3)
    if thal == 6: score += 15  # Fixed defect
    elif thal == 7: score += 10  # Reversible defect
    
    risk_score = min(score, 100)
    
    if risk_score >= 70:
        risk_level, condition = "High", "High Risk of Heart Disease"
    elif risk_score >= 40:
        risk_level, condition = "Medium", "Moderate Risk of Heart Disease"
    else:
        risk_level, condition = "Low", "Low Risk of Heart Disease"
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "condition": condition,
        "recommendations": [
            "Consult cardiologist",
            "Regular cardiac monitoring",
            "Lifestyle modifications",
            "Medication therapy if needed"
        ]
    }

# API Routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if data.get('username') == 'doctor' and data.get('password') == 'heart2024':
        return jsonify({
            'success': True,
            'user': {'name': 'Dr. Cardiac Specialist', 'role': 'cardiologist'}
        })
    return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

@app.route('/api/patients', methods=['GET'])
def get_patients():
    return jsonify(patients_db)

@app.route('/api/patients', methods=['POST'])
def add_patient():
    try:
        data = request.get_json()
        print(f"Received patient data: {data}")  # Debug log
        
        new_id = max([p['id'] for p in patients_db]) + 1 if patients_db else 1
        
        # Generate prediction based on patient data
        prediction_data = {
            'age': data.get('age', 0),
            'gender': data.get('gender', ''),
            'chest_pain': data.get('chest_pain', ''),
            'trestbps': int(data.get('blood_pressure', '120/80').split('/')[0]) if isinstance(data.get('blood_pressure'), str) else data.get('trestbps', 120),
            'chol': data.get('cholesterol', 200),
            'oldpeak': data.get('oldpeak', 0)
        }
        
        prediction = predict_heart_disease(prediction_data)
        
        new_patient = {
            'id': new_id,
            'name': data.get('name', 'Unknown Patient'),
            'age': data.get('age', 0),
            'gender': data.get('gender', 'unknown'),
            'heart_rate': data.get('heart_rate', 72),
            'blood_pressure': data.get('blood_pressure', '120/80'),
            'cholesterol': data.get('cholesterol', 200),
            'oldpeak': data.get('oldpeak', 0),
            'condition': prediction['condition'],
            'risk_level': prediction['risk_level'],
            'risk_score': prediction['risk_score'],
            'last_checkup': datetime.now().strftime('%Y-%m-%d')
        }
        
        patients_db.append(new_patient)
        save_patients(patients_db)
        
        return jsonify({
            'success': True,
            'patient': new_patient,
            'message': 'Patient added successfully'
        })
        
    except Exception as e:
        print(f"Error adding patient: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    prediction = predict_heart_disease(data)
    return jsonify(prediction)

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    total = len(patients_db)
    high_risk = len([p for p in patients_db if p.get('risk_level') == 'High'])
    medium_risk = len([p for p in patients_db if p.get('risk_level') == 'Medium'])
    low_risk = len([p for p in patients_db if p.get('risk_level') == 'Low'])
    
    return jsonify({
        'total_patients': total,
        'high_risk_patients': high_risk,
        'medium_risk_patients': medium_risk,
        'low_risk_patients': low_risk,
        'total_predictions': total + 324,
        'interventions': high_risk + medium_risk + 50,
        'monthly_data': [
            {'month': 'Jan', 'high_risk': max(2, high_risk - 1), 'medium_risk': max(5, medium_risk - 2)},
            {'month': 'Feb', 'high_risk': max(3, high_risk), 'medium_risk': max(8, medium_risk)},
            {'month': 'Mar', 'high_risk': max(4, high_risk + 1), 'medium_risk': max(10, medium_risk + 2)},
            {'month': 'Apr', 'high_risk': max(5, high_risk + 2), 'medium_risk': max(12, medium_risk + 4)},
            {'month': 'May', 'high_risk': max(6, high_risk + 1), 'medium_risk': max(15, medium_risk + 6)},
            {'month': 'Jun', 'high_risk': high_risk, 'medium_risk': medium_risk}
        ]
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/patients/<int:patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    global patients_db
    initial_length = len(patients_db)
    patients_db = [p for p in patients_db if p['id'] != patient_id]
    
    if len(patients_db) < initial_length:
        save_patients(patients_db)
        return jsonify({'success': True, 'message': f'Patient {patient_id} deleted'})
    else:
        return jsonify({'success': False, 'error': 'Patient not found'}), 404

if __name__ == '__main__':
    print("🚀 HeartCare AI System Starting...")
    print("📍 API Server: http://localhost:5000")
    print(f"📊 Loaded {len(patients_db)} patients")
    print("🔑 Login with: username='doctor', password='heart2024'")
    app.run(debug=True, host='0.0.0.0', port=5000)