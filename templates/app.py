from flask import Flask, render_template, request, jsonify
import pandas as pd
import os

app = Flask(__name__)
FILE_NAME = 'verificacion_lotes.xlsx'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/finalizar', methods=['POST'])
def finalizar():
    data = request.json
    df = pd.DataFrame(data)
    
    # Ordenar por lote de forma descendente (Z-A)
    if not df.empty:
        df = df.sort_values(by='lote', ascending=False)
    
    # Guardar en Excel
    if os.path.exists(FILE_NAME):
        existente = pd.read_excel(FILE_NAME)
        df = pd.concat([existente, df], ignore_index=True)
    
    df.to_excel(FILE_NAME, index=False)
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)