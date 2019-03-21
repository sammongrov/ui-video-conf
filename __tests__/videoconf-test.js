import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Actions } from 'react-native-router-flux';
import {
  // Dimensions,
  BackHandler,
  DeviceEventEmitter,
} from 'react-native';
import { RtcEngine /* AgoraView */ } from 'react-native-agora';
import InCallManager from 'react-native-incall-manager';
import md5 from 'react-native-md5';
import AgoraVideoConf from '../index';

configure({ adapter: new Adapter() });

jest.mock('react-native-router-flux', () => ({
  Actions: {
    pop: jest.fn(),
  },
}));

jest.mock('Dimensions', () => ({
  get: () => ({ width: 720, height: 360 }),
}));

jest.mock('BackHandler', () => {
  const backHandler = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return backHandler;
});

jest.mock('RCTDeviceEventEmitter', () => {
  const deviceEventEmitter = {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
  return deviceEventEmitter;
});

jest.mock('../../app/DBManager', () => {
  const dbManager = {
    app: {
      userId: 'MM1258g51dF92',
      getSettingsValue: jest.fn(() => ({ value: 'key-9995564t' })),
    },
    user: {
      list: {
        '0': { _id: 'PP1258g51dF92', name: 'busy-dev' },
        '1': { _id: 'MM1258g51dF92', name: 'dreaming-dev' },
        '2': { _id: 'CM1258g51dF00', name: 'comfort-forever' },
        '3': { _id: 'CM1258g51dF00', name: 'future-dev' },
        '4': { _id: 'UO1258g51dF92', name: 'unit-test-reader' },
      },
    },
  };
  return dbManager;
});

jest.mock('react-native-agora', () => {
  const rtcEngine = {
    init: jest.fn(),
    setDefaultAudioRouteToSpeakerphone: jest.fn(),
    setEnableSpeakerphone: jest.fn(),
    getSdkVersion: jest.fn((cb) => {
      cb('sdk-1.2.3.5');
    }),
    joinChannel: jest.fn(),
    enableAudioVolumeIndication: jest.fn(),
    eventEmitter: jest.fn(),
    startPreview: jest.fn(),
    leaveChannel: jest.fn(),
    destroy: jest.fn(),
    removeEmitter: jest.fn(),
    switchCamera: jest.fn(),
    muteLocalAudioStream: jest.fn(),
    muteAllRemoteAudioStreams: jest.fn(),
    setCameraTorchOn: jest.fn(),
    enableLocalVideo: jest.fn(),
  };
  /* eslint-disable */
  const React = require('React');
  const PropTypes = require('prop-types');
  class MockAgoraView extends React.Component {
    static propTypes = { children: PropTypes.any };

    static defaultProps = { children: '' };

    render() {
      return React.createElement('CameraRollPicker', this.props, this.props.children);
    }
    /* eslint-enable */
  }
  return { RtcEngine: rtcEngine, AgoraView: MockAgoraView };
});

jest.mock('react-native-incall-manager', () => ({
  start: jest.fn(),
  setKeepScreenOn: jest.fn(),
  stop: jest.fn(),
}));

const instance = 'fluffyunicorn';
const groupName = 'unit-test';
const groupID = 'XO12T8PE791l';
const userID = 'MM1258g51dF92';
const onPress = jest.fn();
const props = { instance, groupName, groupID, userID, onPress };

jest.useFakeTimers();

it('VideoConf render - modal is visible', () => {
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({
    isJoinSuccess: true,
    swapModal: true,
    visible: true,
  });
  tree.update();
  const modal = tree.find('Component').last();
  const closeModal = tree.find('TouchableOpacity').last();
  modal.props().onRequestClose();
  closeModal.props().onPress();
  expect(tree.state().visible).toBe(false);
  expect(tree.state().swapModal).toBe(false);
  expect(setTimeout).toBeCalled();
  jest.runAllTimers();
  expect(tree.state().swapModal).toBe(true);
});

/* ------------------------- Snapshots ----------------------- */

it('VideoConf renders correctly', () => {
  const tree = renderer.create(<AgoraVideoConf />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('VideoConf renders correctly', () => {
  const tree = renderer.create(<AgoraVideoConf {...props} />).toJSON();
  expect(tree).toMatchSnapshot();
});

/* ------------------- lifeCycle methods --------------------- */
it('VideoConf - componentWillMount - audio to headset', () => {
  const data = { isPlugged: true };
  DeviceEventEmitter.addListener = jest.fn((str, cb) => {
    cb(data);
  });
  RtcEngine.init.mockClear();
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  InCallManager.start.mockClear();
  InCallManager.setKeepScreenOn.mockClear();
  BackHandler.addEventListener.mockClear();
  shallow(<AgoraVideoConf {...props} />);
  expect(RtcEngine.init).toBeCalledWith({
    appid: 'key-9995564t',
    channelProfile: 1,
    videoProfile: 40,
    clientRole: 1,
    swapWidthAndHeight: true,
  });
  expect(InCallManager.start).toBeCalledWith({ media: 'audio', auto: true, ringback: '' });
  expect(InCallManager.setKeepScreenOn).toBeCalledWith(true);
  expect(DeviceEventEmitter.addListener).toBeCalledWith('WiredHeadset', expect.any(Function));
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(false);
  expect(BackHandler.addEventListener).toBeCalled();
});

it('VideoConf - componentWillMount - audio to speakers', () => {
  const data = { isPlugged: false };
  DeviceEventEmitter.addListener = jest.fn((str, cb) => {
    cb(data);
  });
  RtcEngine.init.mockClear();
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  InCallManager.start.mockClear();
  InCallManager.setKeepScreenOn.mockClear();
  BackHandler.addEventListener.mockClear();
  shallow(<AgoraVideoConf {...props} />);
  expect(RtcEngine.init).toBeCalled();
  expect(InCallManager.start).toBeCalled();
  expect(InCallManager.setKeepScreenOn).toBeCalled();
  expect(DeviceEventEmitter.addListener).toBeCalledWith('WiredHeadset', expect.any(Function));
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(true);
  expect(BackHandler.addEventListener).toBeCalled();
});

it('VideoConf - componentDidMount - audio to speakers, no userID', () => {
  const data = { isPlugged: true };
  DeviceEventEmitter.addListener = jest.fn((str, cb) => {
    cb(data);
  });
  RtcEngine.getSdkVersion.mockClear();
  RtcEngine.joinChannel.mockClear();
  RtcEngine.enableAudioVolumeIndication.mockClear();
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  inst.userID = null;
  inst.componentDidMount();
  expect(RtcEngine.getSdkVersion).toBeCalled();
  expect(RtcEngine.joinChannel).toBeCalled();
  expect(RtcEngine.enableAudioVolumeIndication).toBeCalledWith(500, 3);
  expect(DeviceEventEmitter.addListener).toBeCalledWith('WiredHeadset', expect.any(Function));
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(false);
  expect(RtcEngine.eventEmitter).toBeCalled();
});

it('VideoConf - componentDidMount - onFirstRemoteVideoDecoded, a new remote added', () => {
  const data = { uid: 'US12789564' };
  RtcEngine.eventEmitter = jest.fn((obj) => {
    obj.onFirstRemoteVideoDecoded(data);
    obj.onJoinChannelSuccess();
    obj.onAudioVolumeIndication();
    obj.onUserJoined();
  });
  const remotes = ['MM1258g51dF92', 'CM1258g51dF00'];
  RtcEngine.startPreview.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ remotes });
  const inst = tree.instance();
  inst.componentDidMount();
  expect(RtcEngine.eventEmitter).toBeCalled();
  expect(RtcEngine.startPreview).toBeCalled();
  expect(tree.state().remotes).toEqual([...remotes, data.uid]);
  expect(tree.state().isJoinSuccess).toBe(true);
});

it('VideoConf - componentDidMount - onFirstRemoteVideoDecoded, a new remote is not added', () => {
  const data = { uid: 'US12789564' };
  const errorData = { err: 17 };
  RtcEngine.eventEmitter = jest.fn((obj) => {
    obj.onFirstRemoteVideoDecoded(data);
    obj.onError(errorData);
  });
  const remotes = ['MM1258g51dF92', 'US12789564'];
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ remotes });
  const inst = tree.instance();
  inst.componentDidMount();
  expect(RtcEngine.eventEmitter).toBeCalled();
  expect(RtcEngine.leaveChannel).toBeCalled();
  expect(RtcEngine.destroy).toBeCalled();
  expect(tree.state().remotes).toEqual(remotes);
});

it('VideoConf - componentDidMount - onUserOffline', () => {
  const data = { uid: 'US12789564' };
  const errorData = { err: 23 };
  RtcEngine.eventEmitter = jest.fn((obj) => {
    obj.onUserOffline(data);
    obj.onError(errorData);
  });
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  const remotes = ['MM1258g51dF92', 'US12789564'];
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ remotes });
  const inst = tree.instance();
  inst.componentDidMount();
  expect(RtcEngine.eventEmitter).toBeCalled();
  expect(RtcEngine.leaveChannel).not.toBeCalled();
  expect(RtcEngine.destroy).not.toBeCalled();
  expect(tree.state().remotes).toEqual(remotes.slice(0, 1));
  expect(tree.state().swapModal).toEqual(false);
  expect(setTimeout).toBeCalled();
  jest.runAllTimers();
  expect(tree.state().swapModal).toEqual(true);
});

it('VideoConf - componentWillUnmount', () => {
  RtcEngine.removeEmitter.mockClear();
  InCallManager.stop.mockClear();
  BackHandler.removeEventListener.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  tree.unmount();
  expect(RtcEngine.removeEmitter).toBeCalled();
  expect(InCallManager.stop).toBeCalled();
  expect(BackHandler.removeEventListener).toBeCalled();
  expect(inst._mounted).toBe(false);
});

/* ------------------- component methods --------------------- */
it('VideoConf - onPressVideo', () => {
  const uid = 'US12789564';
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  inst.onPressVideo(uid);
  expect(tree.state().selectUid).toMatch(uid);
  expect(tree.state().visible).toBe(true);
  expect(tree.state().swapModal).toBe(true);
});

it('VideoConf - handleBackPress', () => {
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  Actions.pop.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  const result = inst.handleBackPress();
  expect(RtcEngine.leaveChannel).toBeCalled();
  expect(RtcEngine.destroy).toBeCalled();
  expect(Actions.pop).toBeCalled();
  expect(result).toBe(true);
});

it('VideoConf - handlerCancel', () => {
  RtcEngine.leaveChannel.mockClear();
  RtcEngine.destroy.mockClear();
  Actions.pop.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  inst.handlerCancel();
  expect(RtcEngine.leaveChannel).toBeCalled();
  expect(RtcEngine.destroy).toBeCalled();
  expect(Actions.pop).toBeCalled();
});

it('VideoConf - handlerSwitchCamera', () => {
  RtcEngine.switchCamera.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  inst.handlerSwitchCamera();
  expect(RtcEngine.switchCamera).toBeCalled();
});

it('VideoConf - handlerMuteLocalAudioStream - mounted', () => {
  RtcEngine.muteLocalAudioStream.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ isMute: true });
  const inst = tree.instance();
  inst._mounted = true;
  inst.handlerMuteLocalAudioStream();
  expect(tree.state().isMute).toEqual(false);
  expect(RtcEngine.muteLocalAudioStream).toBeCalledWith(true);
});

it('VideoConf - handlerMuteLocalAudioStream - not mounted', () => {
  RtcEngine.muteLocalAudioStream.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ isMute: true });
  const inst = tree.instance();
  inst._mounted = false;
  inst.handlerMuteLocalAudioStream();
  expect(RtcEngine.muteLocalAudioStream).not.toBeCalled();
});

it('VideoConf - handlerMuteAllRemoteAudioStreams', () => {
  RtcEngine.muteAllRemoteAudioStreams.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ isMute: true });
  const inst = tree.instance();
  inst.handlerMuteAllRemoteAudioStreams();
  expect(tree.state().isMute).toEqual(false);
  expect(RtcEngine.muteAllRemoteAudioStreams).toBeCalledWith(true);
});

it('VideoConf - handlerSetEnableSpeakerphone', () => {
  RtcEngine.setDefaultAudioRouteToSpeakerphone.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ isSpeaker: false });
  const inst = tree.instance();
  inst.handlerSetEnableSpeakerphone();
  expect(tree.state().isSpeaker).toEqual(true);
  expect(RtcEngine.setDefaultAudioRouteToSpeakerphone).toBeCalledWith(false);
});

it('VideoConf - handlerChangeCameraTorch', () => {
  RtcEngine.setCameraTorchOn.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ isCameraTorch: true });
  const inst = tree.instance();
  inst.handlerChangeCameraTorch();
  expect(tree.state().isCameraTorch).toEqual(false);
  expect(RtcEngine.setCameraTorchOn).toBeCalledWith(true);
});

it('VideoConf - handlerChangeVideo', () => {
  RtcEngine.enableLocalVideo.mockClear();
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ disableVideo: false });
  const inst = tree.instance();
  inst.handlerChangeVideo();
  expect(tree.state().disableVideo).toEqual(true);
  expect(RtcEngine.enableLocalVideo).toBeCalledWith(false);
});

it('VideoConf - handlerHideButtons', () => {
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ isHideButtons: false });
  const inst = tree.instance();
  inst.handlerHideButtons();
  expect(tree.state().isHideButtons).toEqual(true);
});

it('VideoConf getUserInfo gets a guest', () => {
  const users = {
    '0': { _id: 'PP1258g51dF92', username: 'busy-dev' },
    '1': { _id: 'MM1258g51dF92', username: 'dreaming-dev' },
    '2': { _id: 'CM1258g51dF00', username: 'comfort-forever' },
    '3': { _id: 'CM1258g51dF00', username: 'future-dev' },
    '4': { _id: 'UO1258g51dF92', username: 'unit-test-reader' },
  };
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  inst.userList = users;
  const username = inst.getUserInfo('ZC1258g51dU52');
  expect(username).toMatch('Guest');
});

it('VideoConf getUserInfo gets a username', () => {
  const users = {
    '0': { _id: 'PP1258g51dF92', username: 'busy-dev' },
    '1': { _id: 'MM1258g51dF92', username: 'dreaming-dev' },
    '2': { _id: 'CM1258g51dF00', username: 'comfort-forever' },
    '3': { _id: 'CM1258g51dF00', username: 'future-dev' },
    '4': { _id: 'UO1258g51dF92', username: 'unit-test-reader' },
  };
  const tree = shallow(<AgoraVideoConf {...props} />);
  const inst = tree.instance();
  inst.userList = users;
  const getVcid = (id) => {
    let vcid = md5.hex_md5(id);
    vcid = vcid.substr(0, 6);
    return parseInt(vcid, 16);
  };
  const username = inst.getUserInfo(getVcid(users['4']._id));
  expect(username).toMatch(users['4'].username);
});

it('VideoConf renderRemotes - no remotes', () => {
  const remotes = ['MM1258g51dF92', 'US12789564', 'CM1258g51dF00'];
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ visible: true });
  const inst = tree.instance();
  const view = shallow(inst.renderRemotes(remotes));
  expect(view).toBeTruthy();
});

it('VideoConf renderRemotes - remotes', () => {
  const remotes = ['MM1258g51dF92', 'US12789564', 'CM1258g51dF00'];
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ visible: false });
  const inst = tree.instance();
  inst.getUserInfo = jest.fn(() => 'superman');
  inst.onPressVideo = jest.fn();
  const videoButton = shallow(inst.renderRemotes(remotes))
    .find('TouchableOpacity')
    .first();
  videoButton.props().onPress();
  expect(inst.getUserInfo).toBeCalledTimes(remotes.length);
  expect(inst.onPressVideo).toBeCalled();
});

it('VideoConf render - disableVideo', () => {
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({ isJoinSuccess: true, swapModal: true, disableVideo: true });
  tree.update();
  const videoOff = tree.find({ name: 'video-off' });
  expect(videoOff.length).toBe(1);
});

it('VideoConf render - not mute', () => {
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({
    isJoinSuccess: true,
    swapModal: true,
    disableVideo: true,
    isHideButtons: false,
    isMute: false,
  });
  tree.update();
  const micOff = tree.find({ name: 'microphone-off' });
  expect(micOff.length).toBe(1);
});

it('VideoConf render - operate button', () => {
  const tree = shallow(<AgoraVideoConf {...props} />);
  tree.setState({
    isJoinSuccess: true,
    swapModal: true,
    disableVideo: true,
    isHideButtons: false,
    isMute: false,
  });
  tree.update();
  const operateButton = tree
    .find('OperateButton')
    .at(0)
    .shallow()
    .find('Icon');
  expect(operateButton.length).toBe(1);
});
