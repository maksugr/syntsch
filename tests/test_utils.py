import pytest
from types import SimpleNamespace

from utils import extract_tool_input


def _make_response(tool_name, tool_input):
    block = SimpleNamespace(type="tool_use", name=tool_name, input=tool_input)
    return SimpleNamespace(content=[block])


def _make_text_response(text):
    block = SimpleNamespace(type="text", text=text)
    return SimpleNamespace(content=[block])


class TestExtractToolInput:
    def test_extracts_matching_tool(self):
        resp = _make_response("submit_events", {"events": [{"name": "Test"}]})
        result = extract_tool_input(resp, "submit_events")
        assert result == {"events": [{"name": "Test"}]}

    def test_wrong_tool_name_raises(self):
        resp = _make_response("submit_events", {"events": []})
        with pytest.raises(RuntimeError, match="choose_event"):
            extract_tool_input(resp, "choose_event")

    def test_text_only_response_raises(self):
        resp = _make_text_response("I cannot do that")
        with pytest.raises(RuntimeError, match="submit_events"):
            extract_tool_input(resp, "submit_events")

    def test_multiple_blocks_finds_correct(self):
        text_block = SimpleNamespace(type="text", text="Thinking...")
        tool_block = SimpleNamespace(type="tool_use", name="choose_event", input={"id": "123"})
        resp = SimpleNamespace(content=[text_block, tool_block])
        result = extract_tool_input(resp, "choose_event")
        assert result == {"id": "123"}

    def test_empty_content_raises(self):
        resp = SimpleNamespace(content=[])
        with pytest.raises(RuntimeError):
            extract_tool_input(resp, "submit_events")
