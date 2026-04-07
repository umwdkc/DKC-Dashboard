#!/bin/bash

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

echo "Setup complete. Run the app with:"
echo "source venv/bin/activate && streamlit run main.py" 