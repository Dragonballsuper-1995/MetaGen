import json

nb = json.load(open('YT_Model_Brain.ipynb', encoding='utf-8'))
print(f"Total cells: {len(nb['cells'])}")
for i, c in enumerate(nb['cells']):
    src = ''.join(c.get('source', []))
    print(f"\n--- Cell {i} ({c.get('cell_type')}) ---")
    print(src[:300])
