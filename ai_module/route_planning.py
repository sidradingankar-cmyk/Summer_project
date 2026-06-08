import heapq


def a_star_accessible(graph, start, goal, accessibility_needs=False):
    """A* pathfinding that respects accessibility constraints.

    Args:
        graph (dict): Mapping node -> list of (neighbor, weight, accessible)
        start (str): Starting node name
        goal (str): Destination node name
        accessibility_needs (bool): If True, only traverse edges marked accessible.

    Returns:
        list or None: Ordered list of node names from start to goal, or None if no path.
    """
    # Validate nodes exist
    if start not in graph or goal not in graph:
        return None

    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {}
    g_score = {node: float('inf') for node in graph}
    g_score[start] = 0

    while open_set:
        _, current = heapq.heappop(open_set)
        if current == goal:
            # Reconstruct path
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            return path[::-1]

        for neighbor, weight, accessible in graph[current]:
            if accessibility_needs and not accessible:
                continue
            tentative = g_score[current] + weight
            if tentative < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative
                heapq.heappush(open_set, (tentative, neighbor))
    return None

# Approximate campus graph for FCRIT Vashi (coordinates are rough offsets from the centre)
# Each tuple: (neighbor, distance weight, accessible flag)
mock_graph = {
    'Main Gate': [
        ('Administrative Block', 2, True),
        ('Canteen', 3, True),
        ('Parking', 2, True)
    ],
    'Administrative Block': [
        ('Main Gate', 2, True),
        ('Library', 2, True),
        ('Computer Eng Block', 1, True),
        ('Mechanical Eng Block', 1, False)  # stairs only
    ],
    'Library': [
        ('Administrative Block', 2, True),
        ('IT Block', 2, True)
    ],
    'Computer Eng Block': [
        ('Administrative Block', 1, True),
        ('Electronics Block', 1, True)
    ],
    'Mechanical Eng Block': [
        ('Administrative Block', 1, False),
        ('Electrical Eng Block', 2, True)
    ],
    'Electronics Block': [
        ('Computer Eng Block', 1, True),
        ('Electrical Eng Block', 2, True)
    ],
    'Electrical Eng Block': [
        ('Mechanical Eng Block', 2, True),
        ('Electronics Block', 2, True),
        ('IT Block', 1, True)
    ],
    'IT Block': [
        ('Library', 2, True),
        ('Electrical Eng Block', 1, True),
        ('Canteen', 2, True)
    ],
    'Canteen': [
        ('Main Gate', 3, True),
        ('IT Block', 2, True),
        ('Parking', 1, True)
    ],
    'Parking': [
        ('Main Gate', 2, True),
        ('Canteen', 1, True)
    ]
}

if __name__ == '__main__':
    print("Accessible Route (Main Gate → Library):")
    print(a_star_accessible(mock_graph, 'Main Gate', 'Library', accessibility_needs=True))
    print("\nStandard Route (Main Gate → Library):")
    print(a_star_accessible(mock_graph, 'Main Gate', 'Library', accessibility_needs=False))
