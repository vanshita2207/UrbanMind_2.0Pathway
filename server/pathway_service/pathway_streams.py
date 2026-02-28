# server/pathway_service/pathway_streams.py

import os
import random
import time
import json

# Load Pathway or work around missing package
try:
    import pathway as pw
    real_pathway = True
except Exception as e:
    print("WARNING: real Pathway package unavailable, data will be generated locally", e)
    real_pathway = False
    # minimal shim for non-Pathway environments
    class Schema: pass
    def file_csv(path, header=False): return None
    def _map(arg=None, func=None):
        if func:
            return None
        return (lambda f: f)
    def _for_each(stream):
        return (lambda f: f)
    def run():
        while True:
            for c in CITIES:
                print(json.dumps(generate_record(c)), flush=True)
            time.sleep(5)
    import types
    pw = types.SimpleNamespace(
        Schema=Schema,
        file_csv=file_csv,
        map=_map,
        for_each=_for_each,
        run=run,
    )

CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai"]

# random-walk state
_last = {c: {'aqi': random.randint(50,150), 'heat_index': random.uniform(25,35)} for c in CITIES}

def generate_record(city, aqi=None, heat_index=None):
    st = _last.setdefault(city, {'aqi':100,'heat_index':30})
    if aqi is None:
        aqi = max(0, min(500, st['aqi'] + random.uniform(-20,20)))
    if heat_index is None:
        heat_index = max(10, min(60, st['heat_index'] + random.uniform(-3,3)))
    st['aqi'], st['heat_index'] = aqi, heat_index
    asthma = "LOW"
    if aqi>200 or heat_index>40: asthma="HIGH"
    elif aqi>150 or heat_index>35: asthma="MEDIUM"
    hospital = "LOW"
    if asthma=="HIGH": hospital="HIGH"
    elif asthma=="MEDIUM": hospital="MEDIUM"
    energy_spike = random.uniform(5,25)
    advisory = "Normal conditions"
    if asthma=="HIGH":
        advisory = "Issue health advisory for children and elderly. Shift industrial load to off-peak."
    elif asthma=="MEDIUM":
        advisory = "Monitor health advisory. Reduce non-essential energy consumption."
    heatwave = heat_index>40
    return {
        "city": city,
        "aqi": int(aqi),
        "heat_index": round(heat_index,1),
        "asthma_risk": asthma,
        "hospital_surge": hospital,
        "energy_demand_spike": energy_spike,
        "advisory": advisory,
        "heatwave_alert": heatwave,
    }

if real_pathway:
    # CSV file watched by Pathway
    BASE = os.path.dirname(__file__)
    INPUT = os.path.join(BASE, "risk_inputs.csv")
    if not os.path.exists(INPUT):
        with open(INPUT, "w", encoding="utf-8") as f:
            f.write("city,aqi,heat_index\n")
    source = pw.file_csv(INPUT, header=True)
    @pw.map
    def compute(city: str, aqi: float, heat_index: float):
        return generate_record(city, aqi, heat_index)
    results = pw.map(source, compute)
    @pw.for_each(results)
    def output(rec):
        print(json.dumps(rec), flush=True)
    if __name__ == "__main__":
        pw.run()
else:
    if __name__ == "__main__":
        while True:
            for c in CITIES:
                print(json.dumps(generate_record(c)), flush=True)
            time.sleep(5)