import os
import requests
import json

# --- UPDATE THESE VALUES ---
# Your monday.com board ID from the URL
BOARD_ID = "18293057187"
# The ID of your status column you found in developer mode
STATUS_COLUMN_ID = "project_status" # <--- PASTE YOUR COLUMN ID HERE
# --- END OF UPDATE SECTION ---

API_KEY = os.environ.get("MONDAY_API_KEY")

def get_board_data():
    headers = {"Authorization": API_KEY, "Content-Type": "application/json"}
    query = f"""
    query {{
        boards (ids: {BOARD_ID}) {{
            items_page {{
                items {{
                    name
                    column_values (ids: ["{STATUS_COLUMN_ID}"]) {{
                        id
                        text
                    }}
                }}
            }}
        }}
    }}
    """
    response = requests.post("https://api.monday.com/v2", json={'query': query}, headers=headers)
    if response.status_code != 200:
        print("Failed to fetch data from monday.com API")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return None
    return response.json()

def generate_markdown_table(data):
    if not data or "data" not in data or not data["data"]["boards"]:
        return "Could not retrieve board data. Please check API key and board/column IDs."

    table = "| Task | Status |\n|---|---|\n"
    # Navigate through the new API response structure for items
    items = data.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("items", [])
    for item in items:
        task_name = item.get("name", "")
        status = ""
        for column in item.get("column_values", []):
            if column.get("id") == STATUS_COLUMN_ID:
                status = column.get("text", "N/A")
        table += f"| {task_name} | {status} |\n"
    return table

def update_readme(table):
    try:
        with open("README.md", "r", encoding="utf-8") as f:
            content = f.read()

        # Find the section to update using comments
        start_marker = "<!-- MONDAY_BOARD_START -->"
        end_marker = "<!-- MONDAY_BOARD_END -->"

        start_index = content.find(start_marker)
        end_index = content.find(end_marker)

        if start_index != -1 and end_index != -1:
            # Ensure we don't include the markers in the part that gets replaced
            before_section = content[:start_index + len(start_marker)]
            after_section = content[end_index:]
            new_content = before_section + "\n" + table + "\n" + after_section
            with open("README.md", "w", encoding="utf-8") as f:
                f.write(new_content)
            print("README.md updated successfully.")
        else:
            print("Could not find the start/end markers in README.md. Please add them.")
            
    except FileNotFoundError:
        print("Error: README.md not found.")
    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    board_data = get_board_data()
    if board_data:
        markdown_table = generate_markdown_table(board_data)
        update_readme(markdown_table)