import React, { Component } from 'react'
import {
    Dimensions,
    Image,
    ScrollView,
    Modal,
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    YellowBox,
    ActivityIndicator,
    Slider
} from 'react-native'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'
import PropTypes from 'prop-types'
import AutoHeightImage from 'react-native-auto-height-image'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { ifIphoneX, isIphoneX, getStatusBarHeight, getBottomSpace } from 'react-native-iphone-x-helper'
import ImageCropOverlay from '../manipulator/ImageCropOverlay'

const { width, height } = Dimensions.get('window')

YellowBox.ignoreWarnings(['componentWillReceiveProps', 'componentWillUpdate', 'componentWillMount']);
YellowBox.ignoreWarnings([
    'Warning: componentWillMount is deprecated',
    'Warning: componentWillReceiveProps is deprecated',
    'Module RCTImageLoader requires',
]);

class ExpoImageManipulator extends Component {
    constructor(props) {
        super(props)
        const { squareAspect } = this.props
        this.state = {
            cropMode: false,
            processing: false,
            zoomScale: 1,
            squareAspect,
            image: {
                width: 1,
                height: 1
            },
            images: [{ uri: this.props.photo.uri }],
            cropped: false,
            sliderValue: 100
        }

        this.scrollOffset = 0

        this.currentPos = {
            left: 0,
            top: 0,
        }

        this.currentSize = {
            width: 0,
            height: 0,
        }

        this.maxSizes = {
            width: 0,
            height: 0,
        }

        this.actualSize = {
            width: 0,
            height: 0
        }
    }

    async componentDidMount() {
        await this.onConvertImageToEditableSize()
    }

    async onConvertImageToEditableSize() {
        const { photo: { uri: rawUri } } = this.props
        const { uri, width, height } = await ImageManipulator.manipulateAsync(rawUri,
            [
                {
                    resize: {
                        width: 1080,
                    },
                },
            ])
        this.setState({
            uri,
        })
        this.actualSize.width = width
        this.actualSize.height = height
    }

    get isRemote() {
        const { uri } = this.state
        return /^(http|https|ftp)?(?:[:/]*)([a-z0-9.-]*)(?::([0-9]+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/.test(uri)
    }

    onToggleModal = () => {
        const { onToggleModal } = this.props
        onToggleModal()
        this.setState({ cropMode: false })
    }

    onCropImage = () => {
        const { uri } = this.state
        this.setState({
            processing: true,
            cropped: true
        })
        Image.getSize(uri, async (actualWidth, actualHeight) => {
            let scaleX = actualWidth / Dimensions.get('window').width;
            let scaleY = actualWidth / Dimensions.get('window').width;
            let cropObj = this.getCropBounds(actualWidth, actualHeight);
            if (cropObj.height > 0 && cropObj.width > 0) {
                let cropper = uri;
                if (this.isRemote) {
                    const response = await FileSystem.downloadAsync(
                        uri,
                        FileSystem.documentDirectory + 'image',
                    )
                    uriToCrop = response.uri
                }
                const { uri: uriCroped, base64, width: croppedWidth, height: croppedHeight } = await this.crop(cropObj, cropper, scale = {
                    scaleX,
                    scaleY
                })

                this.setState({
                    uri: uriCroped,
                    base64,
                    cropMode: false,
                    processing: false,
                    images: [...this.state.images, {
                        uri: uriCroped,
                        width: actualWidth,
                        height: actualHeight,
                        ratio: actualWidth / actualHeight,
                        cropped: true
                    }]
                })
                this.actualSize.width = croppedWidth * scaleX
                this.actualSize.height = croppedHeight * scaleY
            }
        })
    }

    onRotateImage = async () => {
        const { uri } = this.state
        this.setState({ processing: true })
        let uriToCrop = uri
        if (this.isRemote) {
            const response = await FileSystem.downloadAsync(
                uri,
                FileSystem.documentDirectory + 'image',
            )
            uriToCrop = response.uri
        }
        Image.getSize(uri, async (width2, height2) => {
            const { uri: rotUri, base64 } = await this.rotate(uriToCrop, width2, height2)
            this.setState({
                uri: rotUri,
                base64,
                processing: false,
                images: [...this.state.images, { uri: rotUri, cropped: false }]
            })
        })
    }

    onFlipImage = async (orientation) => {
        const { uri } = this.state
        this.setState({ processing: true })
        let uriToCrop = uri
        if (this.isRemote) {
            const response = await FileSystem.downloadAsync(
                uri,
                FileSystem.documentDirectory + 'image',
            )
            uriToCrop = response.uri
        }
        Image.getSize(uri, async (width2, height2) => {
            const { uri: filUri, base64 } = await this.filp(uriToCrop, orientation)
            this.setState({
                uri: filUri, base64, processing: false,
                images: [...this.state.images, {
                    uri: filUri, cropped: false
                }]
            })
        })
    }

    onHandleScroll = (event) => {
        this.scrollOffset = event.nativeEvent.contentOffset.y
    }

    getCropBounds = (actualWidth, actualHeight) => {
        let widther = Dimensions.get('window').width;
        let imageRatio = actualHeight / actualWidth;
        var originalHeight = Dimensions.get('window').width * imageRatio;
        let renderedImageWidth = imageRatio < (originalHeight / width) ? Dimensions.get('window').width : (originalHeight / imageRatio)
        let renderedImageHeight = imageRatio < (originalHeight / width) ? (Dimensions.get('window').width * imageRatio) : originalHeight

        let renderedImageY = (originalHeight - renderedImageHeight) / 2.0
        let renderedImageX = (width - renderedImageWidth) / 2.0
        const renderImageObj = {
            left: renderedImageX,
            top: renderedImageY,
            width: renderedImageWidth,
            height: renderedImageHeight,
        }
        const cropOverlayObj = {
            left: this.currentPos.left,
            top: this.currentPos.top,
            width: this.currentSize.width,
            height: this.currentSize.width,
        }
        var intersectAreaObj = {}

        let x = Math.max(renderImageObj.left, cropOverlayObj.left);
        let num1 = Math.min(renderImageObj.left + renderImageObj.width, cropOverlayObj.left + cropOverlayObj.width);
        let y = Math.max(renderImageObj.top, cropOverlayObj.top);
        let num2 = Math.min(renderImageObj.top + renderImageObj.height, cropOverlayObj.top + cropOverlayObj.height) - renderImageObj.top;
        if (num1 >= x && num2 >= y)
            intersectAreaObj = {
                originX: (x - renderedImageX) * (actualWidth / renderedImageWidth),
                originY: (y - renderedImageY) * (actualWidth / renderedImageWidth),
                width: (num1 - x) * (actualWidth / renderedImageWidth),
                height: (num2 - y) * (actualWidth / renderedImageWidth)
            }
        else {
            intersectAreaObj = {
                originX: x - renderedImageX,
                originY: y - renderedImageY,
                width: 0,
                height: 0
            }
        }
        return intersectAreaObj
    }

    filp = async (uri, orientation) => {
        const { saveOptions } = this.props
        const manipResult = await ImageManipulator.manipulateAsync(uri, [{
            flip: orientation == 'vertical' ? ImageManipulator.FlipType.Vertical : ImageManipulator.FlipType.Horizontal
        }],
            saveOptions
        );
        return manipResult;
    };

    rotate = async (uri, width2, height2) => {
        const { saveOptions } = this.props;
        const manipResult = await ImageManipulator.manipulateAsync(uri, [{
            rotate: -90,
        }, {
            resize: {
                width: this.trueWidth || width2,
                // height: this.trueHeight || height2,
            },
        }], saveOptions)

        return manipResult
    }

    crop = async (cropObj, uri, scale = {
        scaleX: 1,
        scaleY: 1
    }) => {
        const { saveOptions } = this.props
        if (cropObj.height > 0 && cropObj.width > 0) {
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{
                    crop: {
                        originX: cropObj.originX,
                        originY: cropObj.originY,
                        width: cropObj.width,
                        height: cropObj.height
                    }
                }],
                saveOptions,
            )
            return manipResult
        }
        return {
            uri: null,
            base64: null,
        }
    };

    calculateMaxSizes = (event) => {
        let w1 = event.nativeEvent.layout.width || 100
        let h1 = event.nativeEvent.layout.height || 100
        if (this.state.squareAspect) {
            if (w1 < h1) h1 = w1
            else w1 = h1
        }
        this.maxSizes.width = w1
        this.maxSizes.height = h1
    };

    // eslint-disable-next-line camelcase
    async UNSAFE_componentWillReceiveProps() {
        Image.getSize(url, (width, height) => {
            this.setState({
                image: {
                    width,
                    height
                }
            })
            console.log(`The image dimensions are ${width}x${height}`);
        }, (error) => {
            console.error(`Couldn't get the image size: ${error.message}`);
        });
        await this.onConvertImageToEditableSize()
    }

    zoomImage() {
        // this.refs.imageScrollView.zoomScale = 5
        // this.setState({width: width})
        // this.setState({zoomScale: 5})

        // this.setState(curHeight)
    }

    render() {
        if (this.state.processing) {
            return (
                <View style={{
                    flex: 1,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: 9999,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
            )
        }
        const {
            isVisible,
            onPictureChoosed,
            borderColor = '#a4a4a4',
            allowRotate = true,
            pinchGestureEnabled,
            btnTexts,
        } = this.props
        const {
            uri,
            base64,
            cropMode,
            processing,
            zoomScale
        } = this.state
        const { sliderValue } = this.state
        let imageRatio = this.actualSize.height / this.actualSize.width
        var originalHeight = Dimensions.get('window').height - 64
        if (isIphoneX()) {
            originalHeight = Dimensions.get('window').height - 122
        }

        let cropRatio = originalHeight / width
        let cropWidth = imageRatio < cropRatio ? width : originalHeight / cropRatio
        let cropHeight = imageRatio < cropRatio ? width * cropRatio : originalHeight

        let cropInitialTop = (originalHeight - cropHeight) / 2.0
        let cropInitialLeft = ((width - (cropWidth / 2)) - 40 / 2) / 2
        if (this.currentSize.width == 0 && cropMode) {
            this.currentSize.width = cropWidth;
            this.currentSize.height = cropHeight;
            this.currentPos.top = cropInitialTop;
            this.currentPos.left = cropInitialLeft;
        }
        if (uri == undefined) {
            return (
                <View></View>
            )
        } else {
            return (
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={isVisible}
                    hardwareAccelerated
                    onRequestClose={() => {
                        this.onToggleModal()
                    }}>
                    <SafeAreaView
                        style={{
                            width,
                            flexDirection: 'row',
                            backgroundColor: 'black',
                            justifyContent: 'space-between'
                        }}>
                        <ScrollView scrollEnabled={false} horizontal contentContainerStyle={{
                            width: '100%',
                            paddingHorizontal: 5,
                            height: 44,
                            alignItems: 'center'
                        }}>
                            {!cropMode ?
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity onPress={() => this.onToggleModal()} style={{
                                        width: 32,
                                        height: 32,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Icon size={24} name={'arrow-left'} color="white" />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                                        {!this.state.cropped && <TouchableOpacity onPress={() => this.setState({ cropMode: true })} style={{ marginLeft: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../assets/crop-free.png')} style={{ width: 24, height: 24 }}></Image>
                                        </TouchableOpacity>
                                        }
                                        <TouchableOpacity onPress={() => this.onRotateImage()} style={{ marginLeft: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../assets/rotate-left.png')} style={{ width: 24, height: 24 }}></Image>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => this.onFlipImage('vertical')} style={{ marginLeft: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../assets/flip-vertical.png')} style={{ width: 24, height: 24 }}></Image>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => this.onFlipImage('horizontal')} style={{ marginLeft: 10, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                                            <Image source={require('../assets/flip-horizontal.png')} style={{ width: 24, height: 24 }}></Image>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => { onPictureChoosed({ uri, base64 }); this.onToggleModal() }} style={{
                                            marginLeft: 10, width: 80, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 0,
                                            width: 80,
                                            height: 32,
                                            borderRadius: 5,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: "#04D684"
                                        }}>
                                            <Text style={{
                                                fontFamily: this.props.fontFamilyMedium,
                                                letterSpacing: -0.62,
                                                color: 'white',
                                                fontSize: 16,
                                                color: 'black'
                                            }}>{this.props.btnTexts?.done}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View> :
                                <View style={{ flexDirection: 'row', flex: 1, width: Dimensions.get('window').width }}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            this.setState({
                                                cropMode: false
                                            })
                                            this.forceUpdate();
                                            const ratio = this.actualSize.height / this.actualSize.width
                                            this.currentSize.width = Dimensions.get('window').width
                                            this.currentSize.height = Dimensions.get('window').width * (ratio)
                                        }}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            width: 50,
                                            maxWidth: 90,
                                            marginLeft: 5,
                                            alignItems: 'flex-start',
                                            flex: 1,
                                            justifyContent: 'center'
                                        }}>
                                        <Icon size={24} name={'arrow-left'} color="white" />
                                    </TouchableOpacity>
                                    <View style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        alignItems: 'center',

                                    }}>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={"tail"}
                                            style={{
                                                color: 'white',
                                                fontSize: 14.5,
                                                minWidth: 250,
                                                fontFamily: this.props.fontFamilyNormal,
                                                letterSpacing: -0.42,
                                                paddingHorizontal: 10,
                                                textAlignVertical: 'center',
                                                flex: 1
                                            }}>
                                            Fotoğrafı Kare Olarak Kesin
                                            </Text>
                                    </View>
                                    <View style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        width: 90,
                                        maxWidth: 91
                                    }}>
                                        <TouchableOpacity
                                            disabled={this.state.processing}
                                            onPress={() => this.onCropImage()}
                                            style={{
                                                marginRight: 0,
                                                width: 80,
                                                height: 32,
                                                borderRadius: 5,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: "#04D684"
                                            }}>
                                            <Text
                                                style={{
                                                    fontFamily: this.props.fontFamilyMedium,
                                                    color: 'black',
                                                    fontSize: 16,
                                                    letterSpacing: -0.62
                                                }}>{
                                                    processing
                                                        ? this.props.btnTexts?.processing
                                                        : this.props.btnTexts?.crop
                                                }
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            }
                        </ScrollView>
                    </SafeAreaView>
                    <View style={{
                        flex: 1,
                        backgroundColor: 'black',
                        width: Dimensions.get('window').width,
                        height: Dimensions.get('window').height
                    }}>
                        <ScrollView
                            ref={'imageScrollView'}
                            style={{ position: 'relative', flex: 1 }}
                            contentContainerStyle={[{ backgroundColor: 'black', flex: 1 }, { justifyContent: 'center' }]}
                            maximumZoomScale={5}
                            minimumZoomScale={0.5}
                            onScroll={this.onHandleScroll}
                            bounces={false}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            ref={(c) => { this.scrollView = c }}
                            scrollEventThrottle={16}
                            scrollEnabled={false}
                            pinchGestureEnabled={false}
                            // scrollEnabled={cropMode ? false : true}
                            pinchGestureEnabled={cropMode ? false : pinchGestureEnabled}
                        >
                            {!cropMode && this.state.images.length >= 2 && <TouchableOpacity activeOpacity={0.85} onPress={() => {
                                let found = true;
                                let cropData = {};
                                const images = this.state.images.filter((item, index) => {
                                    if (index === this.state.images.length - 1) {
                                        found = !item?.cropped
                                        cropData = item;
                                        return false
                                    }
                                    return true;
                                })
                                this.setState({
                                    images,
                                    uri: images[images.length - 1]?.uri,
                                    cropped: found && this.state.cropped
                                })
                                if (cropData.ratio) {
                                    this.actualSize.width = cropData.width
                                    this.actualSize.height = cropData.height
                                    this.currentSize.width = Dimensions.get('window').width
                                    this.currentSize.height = Dimensions.get('window').width * (1 / cropData.ratio)
                                }
                            }}
                                style={{
                                    width: 100,
                                    height: 45,
                                    position: 'absolute',
                                    zIndex: 9999,
                                    left: 15,
                                    top: 15,
                                    borderRadius: 22.5,
                                    backgroundColor: 'white',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                <Text style={{
                                    fontFamily: this.props.fontFamilyMedium,
                                    letterSpacing: -0.72,
                                    fontSize: 15,
                                    color: 'black'
                                }}>
                                    Geri Al
                                </Text>
                            </TouchableOpacity>}
                            {!cropMode && <AutoHeightImage
                                style={{
                                    backgroundColor: 'black',
                                    borderRadius: 0.1,
                                    borderStyle: 'dashed',
                                    flex: 1
                                }}
                                source={{ uri: this.state.images[this.state.images.length - 1]?.uri }}
                                width={width}
                                resizeMode={imageRatio >= 1 ? "contain" : 'contain'}
                                onLayout={this.calculateMaxSizes}

                            />
                            }
                            <View>
                                {cropMode && (<AutoHeightImage
                                    ref={(auto) => this._autoHeightImageCrop = auto}
                                    style={{
                                        backgroundColor: 'black',
                                        borderRadius: 0.1,
                                        borderStyle: 'dashed',
                                    }}
                                    source={{ uri: this.state.images[this.state.images.length - 1]?.uri }}
                                    resizeMode={imageRatio >= 1 ? "contain" : 'contain'}
                                    width={width}
                                    onLayout={this.calculateMaxSizes}
                                />)
                                }
                                {cropMode && (
                                    <ImageCropOverlay
                                        ref={overlay => this._overlay = overlay}
                                        onLayoutChanged={(top, left, width, height) => {
                                            this.currentSize.width = width <= height ? width - 0.5 : height - 0.5;
                                            this.currentSize.height = width <= height ? width - 0.5 : height - 0.5;
                                            this.currentPos.top = top + 0.5;
                                            this.currentPos.left = left + 0.5;
                                        }}
                                        initialWidth={this.state.initalValue || cropWidth < cropHeight ? cropWidth : cropHeight}
                                        initialHeight={this.state.initalValue || cropWidth < cropHeight ? cropWidth : cropHeight}
                                        initialTop={cropInitialTop}
                                        initialLeft={cropInitialLeft}
                                        maxWidth={this.currentSize.width}
                                        maxHeight={width * (this.actualSize.height / this.actualSize.width)}

                                    />
                                )
                                }
                            </View>
                        </ScrollView>
                        {cropMode && (
                            <View style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                height: 60,
                                width: '100%',
                                backgroundColor: 'black',
                                justifyContent: 'center',
                                flexDirection: 'row'
                            }}>
                                <View style={{ flex: 1, justifyContent: 'center' }}>
                                    <Slider
                                        maximumValue={100}
                                        minimumValue={50}
                                        thumbTintColor={'white'}
                                        minimumTrackTintColor={'#04D684'}
                                        step={1}
                                        value={sliderValue}
                                        onSlidingComplete={(value) => {
                                            this.setState({
                                                sliderValue: parseInt(value),
                                            })
                                        }}
                                        onValueChange={(value) => {
                                            var calcVal = parseInt(value) * (cropWidth < cropHeight ? cropWidth : cropHeight) / 100;
                                            this._overlay.setState(state => ({
                                                initialWidth: calcVal,
                                                initialHeight: calcVal
                                            }))
                                        }}
                                    />
                                </View>
                                <View style={{ width: 30, height: 60, flex: 1, maxWidth: 61, justifyContent: 'center', alignItems: 'center' }}>
                                    {this.props.sliderIcon}
                                </View>
                            </View>
                        )}
                    </View>
                </Modal>
            )
        }
    }
}

export default ExpoImageManipulator

ExpoImageManipulator.defaultProps = {
    onPictureChoosed: ({ uri, base64 }) => console.log('URI:', uri, base64),
    btnTexts: {
        crop: 'Crop',
        rotate: 'Rotate',
        done: 'Done',
        processing: 'Processing',
    },
    sliderIcon: (<View />),
    fontFamilyNormal: '',
    fontFamilyMedium: '',
    fontFamilyBold: '',
    dragVelocity: 5,
    resizeVelocity: 5,
    saveOptions: {
        compress: 0.4,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
    },
}

ExpoImageManipulator.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    onPictureChoosed: PropTypes.func,
    btnTexts: PropTypes.object,
    saveOptions: PropTypes.object,
    photo: PropTypes.object.isRequired,
    onToggleModal: PropTypes.func.isRequired,
    dragVelocity: PropTypes.number,
    resizeVelocity: PropTypes.number,
    fontFamilyNormal: PropTypes.string,
    fontFamilyMedium: PropTypes.string,
    fontFamilyBold: PropTypes.string,
    sliderIcon: PropTypes.element
}
