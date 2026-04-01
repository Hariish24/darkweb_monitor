from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import hashlib
import re
import os

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["darkweb_monitor"]

breaches_col = db["breaches"]
monitored_emails_col = db["monitored_emails"]
alerts_col = db["alerts"]

# ─────────────────────────────────────────────
# Seed simulated breach database on first run
# ─────────────────────────────────────────────
SIMULATED_BREACHES = [
    {
        "breach_name": "LinkedIn",
        "breach_date": "2021-06-22",
        "description": "500M LinkedIn user records including emails, phone numbers, and job titles scraped and posted.",
        "data_classes": ["Email", "Full Name", "Phone Number", "Job Title"],
        "severity": "High",
        "affected_emails": [
            "john.doe@gmail.com", "alice@yahoo.com", "test@example.com",
            "admin@company.com", "user123@hotmail.com"
        ],
        "pwned_passwords": {}
    },
    {
        "breach_name": "RockYou2021",
        "breach_date": "2021-06-04",
        "description": "The largest password compilation ever, with 8.4 billion plaintext passwords leaked.",
        "data_classes": ["Passwords", "Email"],
        "severity": "Critical",
        "affected_emails": [
            "alice@yahoo.com", "bob@gmail.com", "test@example.com",
            "hacker@proton.me", "user@outlook.com"
        ],
        "pwned_passwords": {
            "alice@yahoo.com": "p@ssw0rd123",
            "bob@gmail.com": "qwerty2021",
            "test@example.com": "test1234!"
        }
    },
    {
        "breach_name": "Adobe",
        "breach_date": "2013-10-04",
        "description": "Adobe suffered a major breach exposing 153M user records including encrypted passwords.",
        "data_classes": ["Email", "Password Hints", "Encrypted Passwords", "Usernames"],
        "severity": "High",
        "affected_emails": [
            "creative@adobe.com", "john.doe@gmail.com", "designer@outlook.com",
            "user@example.com", "artist@hotmail.com"
        ],
        "pwned_passwords": {}
    },
    {
        "breach_name": "Facebook",
        "breach_date": "2019-04-03",
        "description": "533 million Facebook users' personal data posted to a hacking forum for free.",
        "data_classes": ["Email", "Phone Number", "Facebook ID", "Name", "Location"],
        "severity": "Medium",
        "affected_emails": [
            "social@facebook.com", "alice@yahoo.com", "john.doe@gmail.com",
            "fb_user@outlook.com", "connect@gmail.com"
        ],
        "pwned_passwords": {}
    },
    {
        "breach_name": "Twitch",
        "breach_date": "2021-10-06",
        "description": "Twitch source code, creator payouts, and 125GB of internal data leaked.",
        "data_classes": ["Email", "Username", "Creator Payouts", "Source Code"],
        "severity": "Critical",
        "affected_emails": [
            "gamer@twitch.tv", "streamer@gmail.com", "user@example.com",
            "pro_gamer@yahoo.com", "twitch_fan@hotmail.com"
        ],
        "pwned_passwords": {}
    },
    {
        "breach_name": "Twitter (X)",
        "breach_date": "2022-08-05",
        "description": "5.4M Twitter accounts exposed via API vulnerability revealing email-to-account links.",
        "data_classes": ["Email", "Phone Number", "Twitter ID", "Username"],
        "severity": "Medium",
        "affected_emails": [
            "tweeter@gmail.com", "social@yahoo.com", "alice@yahoo.com",
            "user123@hotmail.com", "news@outlook.com"
        ],
        "pwned_passwords": {}
    },
    {
        "breach_name": "LastPass",
        "breach_date": "2022-12-23",
        "description": "Attacker stole encrypted password vaults and customer metadata from LastPass.",
        "data_classes": ["Email", "Encrypted Password Vaults", "Billing Address", "IP Address"],
        "severity": "Critical",
        "affected_emails": [
            "secure@gmail.com", "vault_user@yahoo.com", "john.doe@gmail.com",
            "premium@outlook.com", "admin@company.com"
        ],
        "pwned_passwords": {}
    },
    {
        "breach_name": "Canva",
        "breach_date": "2019-05-24",
        "description": "137M Canva accounts breached; usernames, email addresses, and bcrypt password hashes stolen.",
        "data_classes": ["Email", "Username", "Hashed Password", "Name"],
        "severity": "Medium",
        "affected_emails": [
            "designer@gmail.com", "creative@yahoo.com", "bob@gmail.com",
            "artist@hotmail.com", "user@example.com"
        ],
        "pwned_passwords": {}
    },
]


def seed_database():
    if breaches_col.count_documents({}) == 0:
        breaches_col.insert_many(SIMULATED_BREACHES)
        print("✅ Seeded breach database with simulated data")


seed_database()


# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────
def is_valid_email(email):
    return re.match(r"^[\w\.\+\-]+@[\w\.\-]+\.[a-zA-Z]{2,}$", email)


def get_severity_score(breaches):
    score_map = {"Critical": 10, "High": 7, "Medium": 4, "Low": 1}
    if not breaches:
        return 0
    return min(100, sum(score_map.get(b.get("severity", "Low"), 1) for b in breaches))


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.route("/api/check", methods=["POST"])
def check_email():
    data = request.get_json()
    email = data.get("email", "").strip().lower()

    if not email or not is_valid_email(email):
        return jsonify({"error": "Invalid email address"}), 400

    found_breaches = []
    all_breaches = list(breaches_col.find({}))

    for breach in all_breaches:
        affected = [e.lower() for e in breach.get("affected_emails", [])]
        if email in affected:
            pwned_pwd = breach.get("pwned_passwords", {}).get(email)
            found_breaches.append({
                "breach_name": breach["breach_name"],
                "breach_date": breach["breach_date"],
                "description": breach["description"],
                "data_classes": breach["data_classes"],
                "severity": breach["severity"],
                "password_exposed": pwned_pwd is not None,
                "exposed_password": pwned_pwd if pwned_pwd else None,
            })

    risk_score = get_severity_score(found_breaches)
    status = "safe" if not found_breaches else ("critical" if risk_score >= 20 else "at_risk")

    result = {
        "email": email,
        "checked_at": datetime.utcnow().isoformat(),
        "breached": len(found_breaches) > 0,
        "breach_count": len(found_breaches),
        "risk_score": risk_score,
        "status": status,
        "breaches": found_breaches,
    }

    # Persist to monitored emails
    monitored_emails_col.update_one(
        {"email": email},
        {"$set": result},
        upsert=True
    )

    # Create alert if breached
    if found_breaches:
        alerts_col.insert_one({
            "email": email,
            "alert_type": "breach_detected",
            "severity": "Critical" if risk_score >= 20 else "Medium",
            "message": f"{len(found_breaches)} breach(es) found for {email}",
            "created_at": datetime.utcnow().isoformat(),
            "read": False,
        })

    return jsonify(result)


@app.route("/api/stats", methods=["GET"])
def get_stats():
    total_monitored = monitored_emails_col.count_documents({})
    total_breached = monitored_emails_col.count_documents({"breached": True})
    total_breaches_db = breaches_col.count_documents({})
    total_alerts = alerts_col.count_documents({})
    unread_alerts = alerts_col.count_documents({"read": False})

    # Severity distribution
    critical = monitored_emails_col.count_documents({"status": "critical"})
    at_risk = monitored_emails_col.count_documents({"status": "at_risk"})
    safe = monitored_emails_col.count_documents({"status": "safe"})

    return jsonify({
        "total_monitored": total_monitored,
        "total_breached": total_breached,
        "total_breaches_db": total_breaches_db,
        "total_alerts": total_alerts,
        "unread_alerts": unread_alerts,
        "severity_distribution": {
            "critical": critical,
            "at_risk": at_risk,
            "safe": safe,
        }
    })


@app.route("/api/monitored", methods=["GET"])
def get_monitored():
    emails = list(monitored_emails_col.find({}, {"_id": 0}).sort("checked_at", -1))
    return jsonify(emails)


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    alerts = list(alerts_col.find({}, {"_id": 0}).sort("created_at", -1).limit(50))
    return jsonify(alerts)


@app.route("/api/alerts/mark-read", methods=["POST"])
def mark_alerts_read():
    alerts_col.update_many({"read": False}, {"$set": {"read": True}})
    return jsonify({"success": True})


@app.route("/api/breaches", methods=["GET"])
def get_breaches():
    breaches = list(breaches_col.find({}, {"_id": 0, "affected_emails": 0, "pwned_passwords": 0}))
    return jsonify(breaches)


@app.route("/api/delete-email", methods=["POST"])
def delete_email():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    monitored_emails_col.delete_one({"email": email})
    alerts_col.delete_many({"email": email})
    return jsonify({"success": True})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "online", "timestamp": datetime.utcnow().isoformat()})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
