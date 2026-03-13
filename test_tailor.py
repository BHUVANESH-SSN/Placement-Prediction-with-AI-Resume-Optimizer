import requests

url = "http://localhost:5000/api/extract"

# Create dummy JD text and empty PDF for resume
files = {
    "resume_file": ("dummy_resume.pdf", b"%PDF-1.4\n1 0 obj\n...", "application/pdf")
}
data = {
    "input_type": "text",
    "text": "Software Engineer with 3 years Python FastAPI experience."
}

try:
    print("Testing Tailor to JD API...")
    res = requests.post(url, data=data, files=files)
    print(f"Status Code: {res.status_code}")
    print(res.json())
except Exception as e:
    print(f"Error testing API: {e}")
