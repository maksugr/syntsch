from collections import Counter

from sources.tavily_search import _weighted_sample, TavilyEventSource


class TestWeightedSample:
    def test_basic_sampling(self):
        items = ["a", "b", "c", "d"]
        weights = [1.0, 1.0, 1.0, 1.0]
        result = _weighted_sample(items, weights, 2)
        assert len(result) == 2
        assert len(set(result)) == 2

    def test_k_larger_than_items(self):
        items = ["a", "b"]
        weights = [1.0, 1.0]
        result = _weighted_sample(items, weights, 5)
        assert len(result) == 2

    def test_empty_items(self):
        result = _weighted_sample([], [], 3)
        assert result == []

    def test_single_item(self):
        result = _weighted_sample(["x"], [1.0], 1)
        assert result == ["x"]

    def test_heavy_weight_preferred(self):
        items = list(range(10))
        weights = [0.01] * 9 + [100.0]
        counts = Counter()
        for _ in range(200):
            result = _weighted_sample(items.copy(), weights.copy(), 1)
            counts[result[0]] += 1
        assert counts[9] > counts[0]

    def test_no_mutation_of_originals(self):
        items = ["a", "b", "c"]
        weights = [1.0, 2.0, 3.0]
        items_copy = items.copy()
        weights_copy = weights.copy()
        _weighted_sample(items, weights, 2)
        assert items == items_copy
        assert weights == weights_copy


class TestBuildTargetedQueries:
    def test_returns_two_queries(self):
        source = TavilyEventSource.__new__(TavilyEventSource)
        cat_counts = Counter({"music": 10, "cinema": 8, "theater": 0, "exhibition": 0})
        result = source._build_targeted_queries(
            "Berlin", "Feb 15 to Feb 28 2026", cat_counts
        )
        assert len(result) == 2
        for query, domains in result:
            assert "Berlin" in query
            assert len(domains) > 0

    def test_underrepresented_categories_selected(self):
        source = TavilyEventSource.__new__(TavilyEventSource)
        cat_counts = Counter(
            {"music": 100, "cinema": 100, "theater": 0, "exhibition": 1, "club": 0}
        )
        result = source._build_targeted_queries(
            "Berlin", "Feb 15 to Feb 28 2026", cat_counts
        )
        cats_in_queries = [q.split("Berlin ")[1].split(" events")[0] for q, _ in result]
        assert "theater" in cats_in_queries or "club" in cats_in_queries
