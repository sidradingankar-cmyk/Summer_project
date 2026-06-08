from flask import Flask, request, jsonify
from route_planning import a_star_accessible, mock_graph

app = Flask(__name__)

@app.route('/api/plan_route', methods=['GET'])
def plan_route():
    start = request.args.get('start', 'Entrance')
    goal = request.args.get('end', 'Library')
    accessibility_needs = request.args.get('accessibility_needs', 'false').lower() == 'true'

    path = a_star_accessible(mock_graph, start, goal, accessibility_needs)
    
    if path:
        return jsonify({
            'status': 'success',
            'path': path,
            'accessible': accessibility_needs
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'No route found'
        }), 404

if __name__ == '__main__':
    app.run(port=5001, debug=True)
