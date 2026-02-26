import os
import json

import pathway as pw

# Paths for input/output data files (relative to this script)
BASE_DIR = os.path.dirname(__file__)
INPUT_CSV = os.path.join(BASE_DIR, "carbon_inputs.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "carbon_output.csv")

# Ensure input file exists with header (Pathway will watch it for changes)
if not os.path.exists(INPUT_CSV):
    with open(INPUT_CSV, "w", encoding="utf-8") as f:
        f.write("transport,energy,diet,id\n")

# source table that automatically updates whenever the CSV grows
source = pw.file_csv(INPUT_CSV, header=True)

@pw.map
# the arguments must match the column names from the CSV
# Pathway will call this function for every row in the source
# (and re‑run for new rows automatically)
def compute(transport: str, energy: str, diet: str, id: int):
    # replicate the logic from predict.calculate_carbon
    transport_bases = {'car': 3500, 'ev': 1500, 'metro': 800}
    energy_bases = {'grid': 3000, 'hybrid': 1800, 'solar': 500}
    diet_bases = {'average': 2500, 'vegetarian': 1500, 'vegan': 1000}
    other_base = 1500

    t_val = transport_bases.get(transport, 3500)
    e_val = energy_bases.get(energy, 3000)
    d_val = diet_bases.get(diet, 2500)
    total = t_val + e_val + d_val + other_base
    max_val = 10500
    score = max(0, min(100, round(100 - (total / max_val * 60))))

    breakdown = {
        "Transport": t_val,
        "Energy": e_val,
        "Diet": d_val,
        "Other": other_base,
    }

    # Pathway outputs must be simple types; serialize breakdown to JSON string
    return {
        "id": id,
        "total_footprint": total,
        "score": score,
        "breakdown": json.dumps(breakdown),
    }

# apply the map to the source table
results = pw.map(source, compute)
# write results to a CSV file that we can read from the Node server
results.save_csv(OUTPUT_CSV)

# run the pipeline forever (or until the process is killed)
pw.run()
