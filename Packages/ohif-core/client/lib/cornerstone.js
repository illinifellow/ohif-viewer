import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

OHIF.cornerstone = {};

OHIF.cornerstone.pixelToPage = (element, position) => {
    const enabledElement = cornerstone.getEnabledElement(element);
    const result = {
        x: 0,
        y: 0
    };

    // Stop here if the cornerstone element is not enabled or position is not an object
    if (!enabledElement || typeof position !== 'object') {
        return result;
    }

    const canvas = enabledElement.canvas;

    const canvasOffset = $(canvas).offset();
    result.x += canvasOffset.left;
    result.y += canvasOffset.top;

    const canvasPosition = cornerstone.pixelToCanvas(element, position);
    result.x += canvasPosition.x;
    result.y += canvasPosition.y;

    return result;
};

OHIF.cornerstone.repositionTextBoxWhileDragging = (eventData, measurementData) => {
    const element = eventData.element;
    const enabledElement = cornerstone.getEnabledElement(element);
    const $element = $(element);
    const image = enabledElement.image;

    const modifiedCallback = () => {
        const handles = measurementData.handles;
        const textBox = handles.textBox;

        const bounds = {};
        bounds.x = textBox.boundingBox.width;
        bounds.y = textBox.boundingBox.height;

        const getHandlePosition = key => _.pick(handles[key], ['x', 'y']);
        const start = getHandlePosition('start');
        const end = getHandlePosition('end');

        const calculateAxisCenter = axis => {
            const a = start[axis];
            const b = end[axis];
            const lowest = Math.min(a, b);
            const highest = Math.max(a, b);
            return lowest + ((highest - lowest) / 2);
        };

        const tool = {};
        tool.x = calculateAxisCenter('x');
        tool.y = calculateAxisCenter('y');

        const mid = {};
        mid.x = image.width / 2;
        mid.y = image.height / 2;

        const directions = {};
        directions.x = tool.x < mid.x ? -1 : 1;
        directions.y = tool.y < mid.y ? -1 : 1;

        // TODO: REMOVE - Temporary for RSNA (placing always above patient)
        directions.y = -1;

        const points = {};
        points.x = directions.x < 0 ? 0 : image.width;
        points.y = directions.y < 0 ? 0 : image.height;

        const diffX = directions.x < 0 ? tool.x : image.width - tool.x;
        const diffY = directions.y < 0 ? tool.y : image.height - tool.y;

        let cornerAxis = diffY < diffX ? 'y' : 'x';
        let toolAxis = diffY < diffX ? 'x' : 'y';

        // TODO: REMOVE - Temporary for RSNA (placing always above patient)
        cornerAxis = 'y';
        toolAxis = 'x';

        textBox[cornerAxis] = points[cornerAxis];
        textBox[toolAxis] = tool[toolAxis];

        if (directions[cornerAxis] < 0) {
            const topLeft = cornerstone.pageToPixel(element, 0, 0);
            const bottomRight = cornerstone.pageToPixel(element, bounds.x, bounds.y);
            const boxSize = bottomRight[cornerAxis] - topLeft[cornerAxis];
            textBox[cornerAxis] -= boxSize;
        }
    };

    const mouseUpCallback = () => {
        $element.off('CornerstoneToolsMeasurementModified', modifiedCallback);
    };

    $element.one('CornerstoneToolsMouseDrag', () => {
        $element.on('CornerstoneToolsMeasurementModified', modifiedCallback);
    });

    // Using mouseup because sometimes the CornerstoneToolsMouseUp event is not triggered
    $element.one('mouseup', mouseUpCallback);
};
