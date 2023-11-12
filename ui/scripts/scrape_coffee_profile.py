import requests
from bs4 import BeautifulSoup
robots_url = 'https://www.sweetmarias.com/robots.txt'
robots_rq = requests.get(robots_url)
if robots_rq.status_code != 200:
    print("Failed to retrieve the robots.txt file")
    exit()
soup = BeautifulSoup(robots_rq.content, 'html.parser')
print(soup.prettify())

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5)'}
def scrape_coffee_profile(url):
    # Fetch the webpage
    response = requests.get(url,headers=headers)
    print(response)
    if response.status_code != 200:
        return "Failed to retrieve the webpage"

    # Parse the HTML content
    soup = BeautifulSoup(response.content, 'html.parser')

    # Extracting the cupping notes
    cupping_notes = soup.find('div', class_='product attribute cupping-notes').get_text(strip=True)

    # Extracting additional attributes
    specs_table = soup.find('table', class_='additional-attributes-table')
    specs = {}
    for row in specs_table.find_all('tr'):
        label = row.find('th').get_text(strip=True)
        value = row.find('td').get_text(strip=True)
        specs[label] = value

    return cupping_notes, specs

# Example usage
url = 'https://www.sweetmarias.com/burundi-dry-processs-agahore-7567.html'
print(scrape_coffee_profile(url))
