# Benchmark: Basic Styling

## Purpose

Test the agent's ability to apply basic styling to shapes and connections, including fill colors, stroke properties, and font styling.

---

## Test Scenario 1: Shape Fill Colors (CSS Names and Hex Codes)

**User Request:**
> "Create a diagram with three rectangles. The first rectangle should display the text 'Red Fill' and have a red fill using the CSS name 'red'. The second rectangle should display the text 'Blue Fill' and have a blue fill using hex code '#0000FF'. The third rectangle should display the text 'Green Fill' and have a green fill using hex code '#008000'."

**Properties to Assert:**
- [ ] Three rectangles exist
- [ ] A rectangle displays the label "Red Fill" and has a red fill color
- [ ] A rectangle displays the label "Blue Fill" and has a blue fill color (#0000FF)
- [ ] A rectangle displays the label "Green Fill" and has a green fill color (#008000)
- [ ] No connections exist
- [ ] The generated D2 code is valid and parseable

---

## Test Scenario 2: Stroke Colors and Stroke Width

**User Request:**
> "Create a diagram with three circles. The first circle should display the text 'Thin Black Stroke' and have a black stroke color and stroke width 1. The second circle should display the text 'Medium Purple Stroke' and have a purple stroke color and stroke width 5. The third circle should display the text 'Thick Navy Stroke' and have a navy stroke color and stroke width 10."

**Properties to Assert:**
- [ ] Three shapes exist
- [ ] All three shapes are circles
- [ ] A circle displays the label "Thin Black Stroke", has a black stroke, and stroke width 1
- [ ] A circle displays the label "Medium Purple Stroke", has a purple stroke, and stroke width 5
- [ ] A circle displays the label "Thick Navy Stroke", has a navy stroke, and stroke width 10
- [ ] No connections exist
- [ ] The generated D2 code is valid and parseable

---

## Test Scenario 3: Dashed Connections and Font Styling

**User Request:**
> "Create a diagram with two rectangles: one displaying the text 'Start', and one displaying the text 'End'. Connect them with a directed arrow from 'Start' to 'End' that has a dashed line style (stroke-dash value 3). Set the font size of 'Start' to 18 with font color red. Set the font size of 'End' to 14 with font color #0000FF."

**Properties to Assert:**
- [ ] Two rectangles exist
- [ ] A rectangle displays the label "Start" with font size 18 and font color red
- [ ] A rectangle displays the label "End" with font size 14 and font color #0000FF
- [ ] A directed connection exists from Start to End with stroke-dash value 3
- [ ] The generated D2 code is valid and parseable

---

## Success Criteria

A benchmark test passes when:

1. **All requested shapes exist** - Each shape specified in the request is present with the correct type and label
2. **Fill colors are applied correctly** - Shapes have the specified fill colors (CSS names or hex codes)
3. **Stroke properties are applied correctly** - Shapes have the specified stroke colors and widths
4. **Font styling is applied correctly** - Text has the specified font sizes and colors
5. **Connection styling is applied correctly** - Connections have the specified styling (e.g., dashed lines)
6. **No extra elements** - No unexpected shapes, connections, or styling are added
7. **Syntax is valid** - The generated D2 code is syntactically correct and parseable

---

## Error Conditions to Avoid

The agent's output should NOT contain:

- [ ] ❌ Invalid D2 syntax that fails to parse
- [ ] ❌ Missing styling properties that were requested
- [ ] ❌ Incorrect color values (wrong colors or malformed hex codes)
- [ ] ❌ Numeric styling values outside valid ranges (e.g., stroke-width > 15)
- [ ] ❌ Styling applied to wrong elements
- [ ] ❌ Missing shapes or connections
