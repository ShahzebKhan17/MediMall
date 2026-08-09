import json
import urllib.request
import urllib.error
import uuid

API_URL = "http://127.0.0.1:8000/api/v1"


def make_request(path: str, method: str = "GET", data: dict = None, token: str = None) -> dict:
    url = f"{API_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} on {method} {path}: {error_body}")
        raise e


def test_api():
    print("Testing /health ...")
    health = make_request("/health")
    print("Health response:", health)

    # 1. Register Patient
    print("\nRegistering patient...")
    rand_id = uuid.uuid4().hex[:6]
    pat_email = f"patient_{rand_id}@example.com"
    patient_payload = {
        "email": pat_email,
        "password": "securepassword",
        "name": f"Ananya Sharma {rand_id}",
        "age": 28,
        "gender": "Female",
        "phone": "+91 98765 43210",
        "address": "12, 3rd Cross, Indiranagar, Bengaluru, Karnataka 560038",
        "allergies": "No known allergies",
        "blood_group": "O+",
        "role": "patient"
    }
    patient = make_request("/auth/register", method="POST", data=patient_payload)
    print("Registered Patient:", patient["name"], "(ID:", patient["id"], ")")

    # 2. Register Pharmacy
    print("\nRegistering pharmacy...")
    pharm_email = f"pharmacy_{rand_id}@example.com"
    pharmacy_payload = {
        "email": pharm_email,
        "password": "securepassword",
        "name": f"MedPlus Pharmacy {rand_id}",
        "role": "pharmacy",
        "medical_license": "DL-12345-X",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    pharmacy = make_request("/auth/register", method="POST", data=pharmacy_payload)
    print("Registered Pharmacy:", pharmacy["name"], "(ID:", pharmacy["id"], ")")

    # 3. Login Patient
    print("\nLogging in patient...")
    pat_login = make_request("/auth/login", method="POST", data={"email": pat_email, "password": "securepassword"})
    pat_token = pat_login["access_token"]
    print("Patient Login JWT Token received.")

    # 4. Login Pharmacy
    print("\nLogging in pharmacy...")
    pharm_login = make_request("/auth/login", method="POST", data={"email": pharm_email, "password": "securepassword"})
    pharm_token = pharm_login["access_token"]
    print("Pharmacy Login JWT Token received.")

    # 5. Fetch profile as Patient
    print("\nFetching current user profile (/me)...")
    me = make_request("/auth/me", token=pat_token)
    print("Profile name:", me["name"], "Address:", me["address"])

    # 6. Fetch medicines catalog
    print("\nFetching medicines catalog...")
    medicines = make_request("/medicines/", token=pat_token)
    print("Available catalog items:")
    for med in medicines:
        print(f" - [{med['id']}] {med['name']} ({med['brand']}) - Rs.{med['price']} - Stock: {med['stock']}")

    # 7. Place an Order
    print("\nPlacing order for Paracetamol (ID 1) x 2...")
    order_payload = {
        "payment_method": "UPI",
        "items": [
            {"medicine_id": 1, "quantity": 2}
        ]
    }
    order = make_request("/orders/", method="POST", data=order_payload, token=pat_token)
    print(f"Placed Order ID: {order['id']}, Status: {order['status']}, Total: Rs.{order['total']}")

    # 8. Check Pharmacy Dispatch Queue
    print("\nChecking pharmacy queue...")
    queue = make_request("/orders/queue", token=pharm_token)
    print(f"Incoming queue contains {len(queue)} order(s).")
    for q_item in queue:
        print(f" - Order {q_item['id']} by User {q_item['user_id']}: Status is '{q_item['status']}'")

    # 9. Update Order Status
    print(f"\nPharmacy updating status for order {order['id']} to 'Confirmed'...")
    updated_order = make_request(f"/orders/{order['id']}/status", method="PUT", data={"status": "Confirmed"}, token=pharm_token)
    print(f"Updated status is now: {updated_order['status']}")

    # 10. Check Patient Active Order
    print("\nChecking patient active order...")
    active_order = make_request("/orders/active", token=pat_token)
    print(f"Patient active order {active_order['id']} status: '{active_order['status']}'")

    print("\n" + "="*40)
    print("SUCCESS: ALL REST API ENDPOINTS FUNCTION PERFECTLY!")
    print("="*40)


if __name__ == "__main__":
    test_api()
