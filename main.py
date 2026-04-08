import streamlit as st
import pandas as pd
import requests
import json
import os
from datetime import datetime, timedelta
import plotly.express as px
import concurrent.futures

# --- API CONFIG ---
COMPANY = "umwdkc"
USER = os.environ.get("SIMPLYBOOK_USER", "")
PASS = os.environ.get("SIMPLYBOOK_PASS", "")
BOOKING_URL = "https://user-api.simplybook.me/admin/"
LOGIN_URL = "https://user-api.simplybook.me/login"

@st.cache_data(ttl=3600)
def get_admin_token():
    payload = {
        "jsonrpc": "2.0",
        "method": "getUserToken",
        "params": [COMPANY, USER, PASS],
        "id": 1
    }
    headers = {"Content-Type": "application/json"}
    res = requests.post(LOGIN_URL, json=payload, headers=headers)
    return res.json()["result"]

@st.cache_data(ttl=300)
def fetch_bookings(token, from_date, to_date):
    headers = {
        "Content-Type": "application/json",
        "X-Company-Login": COMPANY,
        "X-User-Token": token
    }
    payload = {
        "jsonrpc": "2.0",
        "method": "getBookings",
        "params": [
            {
                "from": from_date,
                "to": to_date,
                "timezone": "America/New_York"
            }
        ],
        "id": 2
    }
    res = requests.post(BOOKING_URL, json=payload, headers=headers)
    return res.json().get("result", [])

import time 
import random
def get_booking_details(token, booking_id, retries=3):
    headers = {
        "Content-Type": "application/json",
        "X-Company-Login": COMPANY,
        "X-User-Token": token
    }
    payload = {
        "jsonrpc": "2.0",
        "method": "getBookingDetails",
        "params": [booking_id],
        "id": 3
    }

    for attempt in range(retries):
        try:
            res = requests.post(BOOKING_URL, json=payload, headers=headers, timeout=10)

            # Check if the content type is JSON
            if res.headers.get("Content-Type", "").startswith("application/json"):
                return res.json().get("result")
            else:
                print(f"Non-JSON response for booking {booking_id}: {res.text[:100]}")
                return None
        except (requests.RequestException, ValueError) as e:
            print(f"Error fetching details for booking {booking_id} (attempt {attempt + 1}): {e}")
            time.sleep(0.5 + random.uniform(0, 0.5))  # slight backoff
    return None
# NEW: Fetch all booking details in parallel
def fetch_all_booking_details(token, bookings):
    def get_details(b):
        booking_id = b.get("id")
        details = get_booking_details(token, booking_id)
        return booking_id, details
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        booking_details = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(get_details, b) for b in bookings]
            for future in concurrent.futures.as_completed(futures):
                try:
                    booking_id, detail = future.result()
                    booking_details[booking_id] = detail
                except Exception as e:
                    print(f"Error fetching details: {e}")
    return booking_details

# --- STREAMLIT UI ---
st.set_page_config("DKC Bookings Dashboard", layout="wide")
st.title("📅 DKC Bookings Dashboard")

# Date range picker
col1, col2 = st.columns(2)
with col1:
    start_date = st.date_input("Start date", datetime.now() - timedelta(days=30))
with col2:
    end_date = st.date_input("End date", datetime.now())

token = get_admin_token()
bookings = fetch_bookings(token, start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"))

st.subheader("🛠 Raw Booking Data (Debug)")
st.json(bookings[:3])

# Convert to DataFrame
if bookings:
    details_dict = fetch_all_booking_details(token, bookings)

    data = []
    for b in bookings:
        booking_id = b.get("id")
        details = details_dict.get(booking_id, {})
        provider_name = details.get("provider", {}).get("name", "") if details else ""

        client_data = b.get("client", {})
        client_name = client_data.get("full_name", "") if isinstance(client_data, dict) else client_data

        data.append({
            "Date": b.get("start_date"),
            "Status": b.get("status"),
            "Client": client_name,
            "Service": b.get("unit", ""),
            "Provider": provider_name,
            "Code": b.get("code", "")
        })


    df = pd.DataFrame(data)
    reservable_spaces = ["Podcast Studio", "Sewing Machine", "Production Studio", "3D Printer", "Cricut"]
    df["Category"] = df["Provider"].apply(
    lambda x: "Space" if any(space.lower() in x.lower() for space in reservable_spaces) else "Staff"
)
    

    # Split into two DataFrames
    df_staff = df[df["Category"] == "Staff"]
    df_spaces = df[df["Category"] == "Space"]

    # Bookings Table
    st.subheader("📋 Bookings Table")
    st.dataframe(df, use_container_width=True)


    st.subheader("📊 Bookings by Service")
    fig1 = px.histogram(df, x="Service", color="Service", title="Bookings by Service")
    st.plotly_chart(fig1, use_container_width=True)

    # Bookings by Staff
    st.subheader("👩‍💼 Appointments by Staff")
    if not df_staff.empty:
        fig_staff = px.histogram(df_staff, x="Provider", color="Provider", title="Appointments by Staff")
        st.plotly_chart(fig_staff, use_container_width=True)
    else:
        st.info("No staff appointments in selected date range.")

    # Bookings by Space
    st.subheader("🏢 Reservations by Space")
    if not df_spaces.empty:
        fig_space = px.histogram(df_spaces, x="Provider", color="Provider", title="Reservations by Space")
        st.plotly_chart(fig_space, use_container_width=True)
    else:
        st.info("No space reservations in selected date range.")

    # Bookings over Time
    st.subheader("📅 Bookings over Time")
    df["Date"] = pd.to_datetime(df["Date"])
    fig3 = px.histogram(df, x="Date", title="Bookings Over Time")
    st.plotly_chart(fig3, use_container_width=True)

else:
    st.warning("No bookings found for the selected date range.")
