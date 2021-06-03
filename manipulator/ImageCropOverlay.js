import React, { Component } from 'react'
import { View, PanResponder, Dimensions } from 'react-native';
class ImageCropOverlay extends React.Component {

    state = {
        draggingTL: false,
        draggingTM: false,
        draggingTR: false,
        draggingML: false,
        draggingMM: false,
        draggingMR: false,
        draggingBL: false,
        draggingBM: false,
        draggingBR: false,
        initialTop: this.props.initialTop,
        initialLeft: this.props.initialLeft,
        initialWidth: this.props.initialWidth,
        initialHeight: this.props.initialHeight,
        offsetTop: 0,
        offsetLeft: 0,
        currentlyDragging: false,
        maxWidth: this.props.maxWidth,
        maxHeight: this.props.maxHeight,
        currentTop: this.props.initialHeight / 2,
        currentLeft: this.props.initialWidth / 2
    }

    panResponder = {}

    UNSAFE_componentWillMount() {
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
            onPanResponderGrant: this.handlePanResponderGrant,
            onPanResponderMove: this.handlePanResponderMove,
            onPanResponderRelease: this.handlePanResponderEnd,
            onPanResponderTermination: this.handlePanResponderEnd,
        })
    }
    reCalculateSize() {
        this.setState({
            initialWidth: this.props.initialWidth,
            initialHeight: this.props.initialHeight,
            initialLeft: this.props.initialLeft,
            initialTop: this.props.initialTop,
        })
    }

    render() {
        const { draggingTL, draggingTM, draggingTR, draggingML, draggingMM, draggingMR, draggingBL, draggingBM, draggingBR, initialTop, initialLeft, initialHeight, initialWidth, offsetTop, offsetLeft } = this.state
        const style = { position: 'absolute', zIndex: 9999 }
        style.top = initialTop + ((draggingTM || draggingTL || draggingTR || draggingMM) ? offsetTop : 0)
        style.left = initialLeft + ((draggingTL || draggingML || draggingBL || draggingMM) ? offsetLeft : 0)
        style.width = initialWidth + ((draggingTL || draggingML || draggingBL) ? - offsetLeft : (draggingTM || draggingMM || draggingBM) ? 0 : offsetLeft)
        style.height = initialHeight + ((draggingTL || draggingTM || draggingTR) ? - offsetTop : (draggingML || draggingMM || draggingMR) ? 0 : offsetTop)
        if (style.width > this.props.initialWidth) {
            style.width = this.props.initialWidth
        }
        if (style.width < this.props.minWidth) {
            style.width = this.props.minWidth
        }
        if (style.height > this.props.initialHeight) {
            style.height = this.props.initialHeight
        }
        if (style.height < this.props.minHeight) {
            style.height = this.props.minHeight
        }
        if (style.left <= 0) {
            style.left = 1;
        }
        if (style.top <= 0) {
            style.top = 1;
        }
        if (style.top + style.height >= this.state.maxHeight) {
            style.top = (this.state.maxHeight - style.height) - 1
        }
        if (style.left + style.width >= this.state.maxWidth) {
            style.left = (this.state.maxWidth - style.width) - 1
        }
        if (this.props.maxHeight >= this.props.maxWidth) {
            style.height = style.width;
        } else {
            style.width = style.height;
        }
        this.state.currentTop = style.top;
        this.state.currentLeft = style.left;
        return (
            <View {...this.panResponder.panHandlers} ref={(cropper) => this._cropper = cropper} style={[
                {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'absolute',
                    borderStyle: 'solid',
                    borderWidth: 2,
                    borderColor: '#a4a4a4',
                    backgroundColor: 'rgb(0,0,0,0.5)',
                    minWidth: 30,
                    minHeight: 30
                },
                style,
                { ...this.props.style }]}>
                <View>
                    <View style={{ flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent' }}>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingTL ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingTM ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingTR ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                    </View>
                    <View style={{ flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent' }}>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingML ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingMM ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingMR ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                    </View>
                    <View style={{ flexDirection: 'row', width: '100%', flex: 1 / 3, backgroundColor: 'transparent' }}>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingBL ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingBM ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                        <View style={{ borderWidth: '#a4a4a4', borderWidth: 0, backgroundColor: draggingBR ? 'transparent' : 'transparent', flex: 1 / 3, height: '100%' }}></View>
                    </View>
                    <View style={{ top: 0, left: 0, width: '100%', height: '100%', position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        <View style={{ flex: 1 / 3, flexDirection: 'row' }}>
                            <View style={{ flex: 3, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid' }}>
                                <View style={{ position: 'absolute', left: 5, top: 5, borderLeftWidth: 0, borderTopWidth: 0, height: 20, width: 20, borderColor: '#f4f4f4', borderStyle: 'solid' }} />
                            </View>
                            <View style={{ flex: 3, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid' }}>
                            </View>
                            <View style={{ flex: 3, borderBottomWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid' }}>
                                <View style={{ position: 'absolute', right: 5, top: 5, borderRightWidth: 0, borderTopWidth: 0, height: 20, width: 20, borderColor: '#f4f4f4', borderStyle: 'solid' }} />
                            </View>
                        </View>
                        <View style={{ flex: 1 / 3, flexDirection: 'row' }}>
                            <View style={{ flex: 3, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid' }}>
                            </View>
                            <View style={{ flex: 3, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid' }}>
                            </View>
                            <View style={{ flex: 3, borderBottomWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid' }}>
                            </View>
                        </View>
                        <View style={{ flex: 1 / 3, flexDirection: 'row' }}>
                            <View style={{ flex: 3, borderRightWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid', position: 'relative', }}>
                                <View style={{ position: 'absolute', left: 5, bottom: 5, borderLeftWidth: 0, borderBottomWidth: 0, height: 20, width: 20, borderColor: '#f4f4f4', borderStyle: 'solid' }} />
                            </View>
                            <View style={{ flex: 3, borderRightWidth: 1, borderColor: '#c9c9c9', borderStyle: 'solid' }}>
                            </View>
                            <View style={{ flex: 3, position: 'relative' }}>
                                <View style={{ position: 'absolute', left: 5, bottom: 5, borderLeftWidth: 0, borderBottomWidth: 0, height: 20, width: 20, borderColor: '#f4f4f4', borderStyle: 'solid' }} />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        )
    }
    getTappedItem(x, y) {
        let { initialLeft, initialTop, initialWidth, initialHeight } = this.state
        this.props.updatedCallback();
        let xPos = parseInt((x - initialLeft) / (initialWidth / 3))
        let yPos = parseInt((y - initialTop) / (initialWidth / 3))
        let index = ((yPos * 3 + xPos) % 9).toFixed(0)
        return 'mm';
        if (index == 0) {
            return 'mm';
            return 'tl';
        } else if (index == 1) {
            return 'mm';
            return 'tm';
        } else if (index == 2) {
            return 'mm';
            return 'tr';
        } else if (index == 3) {
            return 'mm';
            return 'ml';
        } else if (index == 4) {
            return 'mm';
        } else if (index == 5) {
            return 'mm';
            return 'mr';
        } else if (index == 6) {
            return 'mm';
            return 'bl';
        } else if (index == 7) {
            return 'mm';
            return 'bm';
        } else if (index == 8) {
            //alert('br')
            return 'mm';
            return 'br';
        } else {
            return 'mm';
        }
    }

    // Should we become active when the user presses down on the square?
    handleStartShouldSetPanResponder = (event) => {
        return true
    }
    // We were granted responder status! Let's update the UI
    handlePanResponderGrant = (event) => {
        // console.log(event.nativeEvent.locationX + ', ' + event.nativeEvent.locationY)
        if (this.state.currentlyDragging === true) {
            return;
        }
        let selectedItem = this.getTappedItem(event.nativeEvent.pageX, event.nativeEvent.pageY)
        if (selectedItem == 'tl') {
            this.setState({ draggingTL: true, currentlyDragging: true })
        } else if (selectedItem == 'tm') {
            this.setState({ draggingTM: true, currentlyDragging: true })
        } else if (selectedItem == 'tr') {
            this.setState({ draggingTR: true, currentlyDragging: true })
        } else if (selectedItem == 'ml') {
            this.setState({ draggingML: true, currentlyDragging: true })
        } else if (selectedItem == 'mm') {
            this.setState({ draggingMM: true, currentlyDragging: true })
        } else if (selectedItem == 'mr') {
            this.setState({ draggingMR: true, currentlyDragging: true })
        } else if (selectedItem == 'bl') {
            this.setState({ draggingBL: true, currentlyDragging: true })
        } else if (selectedItem == 'bm') {
            this.setState({ draggingBM: true, currentlyDragging: true })
        } else if (selectedItem == 'br') {
            this.setState({ draggingBR: true, currentlyDragging: true })
        }
    }

    // Every time the touch/mouse moves
    handlePanResponderMove = (e, gestureState) => {
        // Keep track of how far we've moved in total (dx and dy)
        this.setState({
            offsetTop: gestureState.dy,
            offsetLeft: gestureState.dx,
        })
    }

    // When the touch/mouse is lifted
    handlePanResponderEnd = (e, gestureState) => {
        const { initialTop, initialLeft, initialWidth, initialHeight, draggingTL, draggingTM, draggingTR, draggingML, draggingMM, draggingMR, draggingBL, draggingBM, draggingBR } = this.state

        const state = {
            draggingTL: false,
            draggingTM: false,
            draggingTR: false,
            draggingML: false,
            draggingMM: false,
            draggingMR: false,
            draggingBL: false,
            draggingBM: false,
            draggingBR: false,
            offsetTop: 0,
            offsetLeft: 0,
        }
        state.initialTop = initialTop + ((draggingTL || draggingTM || draggingTR || draggingMM) ? this.state.currentTop - initialTop/*gestureState.dy*/ : 0)
        state.initialLeft = initialLeft + ((draggingTL || draggingML || draggingBL || draggingMM) ? this.state.currentLeft - initialLeft/* gestureState.dx */ : 0)
        state.initialWidth = initialWidth + ((draggingTL || draggingML || draggingBL) ? - gestureState.dx : (draggingTM || draggingMM || draggingBM) ? 0 : gestureState.dx)
        state.initialHeight = initialHeight + ((draggingTL || draggingTM || draggingTR) ? - gestureState.dy : (draggingML || draggingMM || draggingMR) ? 0 : gestureState.dy)

        if (state.initialWidth > this.props.initialWidth) {
            state.initialWidth = this.props.initialWidth
        }
        if (state.initialWidth < this.props.minWidth) {
            state.initialWidth = this.props.minWidth
        }
        if (state.initialHeight > this.props.initialHeight) {
            state.initialHeight = this.props.initialHeight
        }
        if (state.initialHeight < this.props.minHeight) {
            state.initialHeight = this.props.minHeight
        }
        state.currentlyDragging = false
        this.setState(state, () => {
            this.props.onLayoutChanged(state.initialTop, state.initialLeft, state.initialWidth, state.initialHeight)
        })
    }
}

export default ImageCropOverlay;