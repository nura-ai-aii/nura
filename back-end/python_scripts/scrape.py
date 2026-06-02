import sys
import json
import time
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing command argument. Use 'selenium' or 'bs4'."}))
        return

    command = sys.argv[1]
    url = sys.argv[2] if len(sys.argv) > 2 else None

    if not url:
        print(json.dumps({"error": "Missing URL argument"}))
        return

    try:
        if command == "selenium":
            # Headless Chrome execution
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            
            driver = webdriver.Chrome(options=chrome_options)
            driver.get(url)
            
            # Wait a moment for dynamic content
            time.sleep(2)
            
            title = driver.title
            html = driver.page_source
            
            # Use BeautifulSoup to parse text from the selenium HTML
            soup = BeautifulSoup(html, 'html.parser')
            text = soup.get_text(separator=' ', strip=True)
            
            driver.quit()
            
            print(json.dumps({
                "status": "success", 
                "title": title,
                "text": text[:1000] + ("..." if len(text) > 1000 else "")  # Return first 1000 chars
            }))
            
        elif command == "bs4":
            import requests
            response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            title = soup.title.string if soup.title else "No Title"
            text = soup.get_text(separator=' ', strip=True)
            
            print(json.dumps({
                "status": "success", 
                "title": title,
                "text": text[:1000] + ("..." if len(text) > 1000 else "")
            }))
            
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
