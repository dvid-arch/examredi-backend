import json
import os

def find_paper():
    filepath = 'src/db/all_papers.json'
    if not os.path.exists(filepath):
        print(f"File {filepath} not found")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            papers = json.load(f)
            found = False
            for p in papers:
                if str(p.get('year')) == '2015' and 'Account' in p.get('subject', ''):
                    print(json.dumps({
                        'id': p.get('id'),
                        'subject': p.get('subject'),
                        'year': p.get('year'),
                        'q_count': len(p.get('questions', []))
                    }, indent=2))
                    found = True
            
            if not found:
                print("No 2015 Accounting paper found in JSON")
        except Exception as e:
            print(f"Error: {e}")

find_paper()
