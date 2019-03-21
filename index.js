/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component, PureComponent } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  DeviceEventEmitter,
  BackHandler,
} from 'react-native';

import { RtcEngine, AgoraView } from 'react-native-agora';
import { Actions } from 'react-native-router-flux';
import PropTypes from 'prop-types';
// import { Network } from 'roverz-chat';
import { Icon, Text } from 'react-native-elements';
// import md5 from 'react-native-md5';
import InCallManager from 'react-native-incall-manager';
import md5 from 'react-native-md5';
// import DBManager from '../app/DBManager';
import {DBManager} from 'app-module';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  absView: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  videoView: {
    padding: 5,
    flexWrap: 'wrap',
    flexDirection: 'row',
    zIndex: 100,
  },
  localView: {
    flex: 1,
  },
  remoteView: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    margin: 5,
    zIndex: 200,
  },
  // bottomView: {
  //   padding: 20,
  //   flexDirection: 'row',
  //   justifyContent: 'space-around',
  // },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    padding: 20,
    // flexDirection: 'column',
    // justifyContent: 'space-around',
    // alignItems: 'center',
  },
  bottomView: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionBtns: {
    marginVertical: 7,
  },
  callEndBtn: {
    alignSelf: 'center',
    // marginVertical: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff5151',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtns: {
    // marginVertical: 5,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnsOn: {
    marginVertical: 5,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#878787',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default class AgoraVideoConf extends Component {
  constructor(props) {
    super(props);
    this._mounted = false;
    // this._net = new Network();
    this._memberListData = [];
    this.gid = props.groupID;
    this.userID = DBManager.app.userId;
    this.instance = props.instance;
    this.state = {
      remotes: [],
      isJoinSuccess: false,
      isSpeaker: true,
      // isHeadset: false,
      isMute: true,
      isCameraTorch: false,
      disableVideo: false,
      isHideButtons: false,
      visible: false,
      selectUid: undefined,
      swapModal: true,
    };
  }

  componentWillMount() {
    // Props Example
    // import DBManager from '../app/DBManager';
    const appID = DBManager.app.getSettingsValue('MGVC_Key');
    this.userList = DBManager.user.list;
    // Agora initialization
    const options = {
      appid: appID.value,
      channelProfile: 1,
      videoProfile: 40,
      clientRole: 1,
      swapWidthAndHeight: true,
    };
    RtcEngine.init(options);

    InCallManager.start({ media: 'audio', auto: true, ringback: '' });
    InCallManager.setKeepScreenOn(true);
    // console.log('WiredHeadset componentWillMount');
    DeviceEventEmitter.addListener('WiredHeadset', (data) => {
      // --- do something with events
      // data: {'isPlugged': boolean, 'hasMic': boolean, 'deviceName': string }
      console.log('WiredHeadset event fired', data);
      if (data.isPlugged) {
        this.setState({ /* isHeadset: true, */ isSpeaker: false }, () => {
          RtcEngine.setDefaultAudioRouteToSpeakerphone(false);
        });
      } else {
        this.setState({ /* isHeadset: false, */ isSpeaker: true }, () => {
          RtcEngine.setDefaultAudioRouteToSpeakerphone(true);
        });
      }
    });
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    // DeviceEventEmitter.addListener('Proximity', (data) => {
    //   // data: {'isNear': boolean}
    //   console.log('Proximity event fired', data);
    //   if (!this.state.isHeadset) {
    //     RtcEngine.setEnableSpeakerphone(true);
    //   } else {
    //     RtcEngine.setEnableSpeakerphone(false);
    //   }
    // });
  }

  componentDidMount() {
    let vcuserID = 0;
    if (this.userID) {
      vcuserID = md5.hex_md5(this.userID);
      vcuserID = vcuserID.length > 6 ? vcuserID.substr(0, 6) : vcuserID;
      vcuserID = parseInt(vcuserID, 16);
    }
    const channelID = `${this.instance}.${this.gid}`;

    // Temporary for testing
    // var tempUID = '12345678';
    // const numberUID = parseInt(tempUID, 16);
    // const channelID = 'mongrovcom';

    // The current version number
    RtcEngine.getSdkVersion((version) => {
      console.log(version);
    });

    // Join the room
    // RtcEngine.joinChannel();
    console.log('VIDEO CONF USERID', vcuserID, 'CHANELID', channelID);
    RtcEngine.joinChannel(channelID, vcuserID);

    // Enable speaker volume alert
    RtcEngine.enableAudioVolumeIndication(500, 3);
    // RtcEngine.setEnableSpeakerphone(true);
    DeviceEventEmitter.addListener('WiredHeadset', (data) => {
      // --- do something with events
      // data: {'isPlugged': boolean, 'hasMic': boolean, 'deviceName': string }
      if (data.isPlugged) {
        this.setState({ /* isHeadset: true, */ isSpeaker: false }, () => {
          RtcEngine.setDefaultAudioRouteToSpeakerphone(false);
        });
      } else {
        this.setState({ /* isHeadset: false, */ isSpeaker: true }, () => {
          RtcEngine.setDefaultAudioRouteToSpeakerphone(true);
        });
      }
    });

    // All the native notification unified management
    RtcEngine.eventEmitter({
      onFirstRemoteVideoDecoded: (data) => {
        console.log(data);
        // There is a remote video to join Back to important uid AgoraView sets the remoteUid value based on the uid
        const { remotes } = this.state;
        const newRemotes = [...remotes];
        // There is a situation where disconnection reconnection causes the callback multiple times,
        // and remote videos that have been added are not added repeatedly
        if (!remotes.find((uid) => uid === data.uid)) {
          newRemotes.push(data.uid);
        }
        this.setState({ remotes: newRemotes });
      },
      onUserOffline: (data) => {
        // Someone left!
        const { remotes } = this.state;
        const newRemotes = remotes.filter((uid) => uid !== data.uid);
        // this.setState({ remotes: newRemotes });
        this.setState(
          {
            remotes: newRemotes,
            swapModal: false,
          },
          () => {
            setTimeout(() => this.setState({ swapModal: true }), 1);
          },
        );
      },
      onJoinChannelSuccess: () => {
        // Join the room successfully
        // console.log("VCTEST On Join channel success",data);
        // Turn on the webcam preview
        RtcEngine.startPreview();

        this.setState({
          isJoinSuccess: true,
        });
      },
      onAudioVolumeIndication: () => {
        // Sound callback
        // console.log(data, '-----');
      },
      onUserJoined: (user) => {
        console.log('VCTEST On user Join channel success', user);
        // const userInfo =  this.getUserInfo(user.uid);

        // const { remotes } = this.state;
        // const newRemotes = [...remotes];
        // console.log("VCTEST USERINFO",userInfo);
        // console.log("VCTEST NEW-REMOTES",newRemotes);
        // console.log("VCTEST REMOTES",remotes)
        // if (remotes.find((uid) => uid === userInfo.uid)) {
        //     remotes
        // }
        // somebody is coming!
      },
      onError: (data) => {
        console.log(data);
        // error!

        if (data.err === 17) {
          RtcEngine.stopPreview();
          RtcEngine.leaveChannel();
          RtcEngine.destroy();
        }

        // const { onCancel } = this.props;
        // onCancel(data.err);
        // Actions.pop();
      },
    });
    this._mounted = true;
  }

  componentWillUnmount() {
    RtcEngine.removeEmitter();
    InCallManager.stop();
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    this._mounted = false;
  }

  onPressVideo = (uid) => {
    this.setState(
      {
        selectUid: uid,
      },
      () => {
        this.setState({
          visible: true,
          swapModal: true,
        });
      },
    );
  };

  handleBackPress = () => {
    RtcEngine.stopPreview();
    RtcEngine.leaveChannel();
    RtcEngine.destroy();
    Actions.pop();
    return true;
  };

  handlerCancel = () => {
    RtcEngine.stopPreview();
    RtcEngine.leaveChannel();
    RtcEngine.destroy();

    // const { onCancel } = this.props;
    // onCancel();
    Actions.pop();
  };

  handlerSwitchCamera = () => {
    RtcEngine.switchCamera();
  };

  handlerMuteLocalAudioStream = () => {
    const { isMute } = this.state;
    if (this._mounted) {
      this.setState(
        {
          isMute: !isMute,
        },
        () => {
          RtcEngine.muteLocalAudioStream(isMute);
        },
      );
    }
  };

  handlerMuteAllRemoteAudioStreams = () => {
    const { isMute } = this.state;
    this.setState(
      {
        isMute: !isMute,
      },
      () => {
        RtcEngine.muteAllRemoteAudioStreams(isMute);
      },
    );
  };

  handlerSetEnableSpeakerphone = () => {
    const { isSpeaker } = this.state;
    this.setState(
      {
        isSpeaker: !isSpeaker,
      },
      () => {
        RtcEngine.setDefaultAudioRouteToSpeakerphone(isSpeaker);
      },
    );
  };

  handlerChangeCameraTorch = () => {
    const { isCameraTorch } = this.state;
    this.setState(
      {
        isCameraTorch: !isCameraTorch,
      },
      () => {
        RtcEngine.setCameraTorchOn(isCameraTorch);
      },
    );
  };

  handlerChangeVideo = () => {
    const { disableVideo } = this.state;
    this.setState(
      {
        disableVideo: !disableVideo,
      },
      () => {
        RtcEngine.enableLocalVideo(disableVideo);
      },
    );
  };

  handlerHideButtons = () => {
    const { isHideButtons } = this.state;
    this.setState({
      isHideButtons: !isHideButtons,
    });
  };

  getUserInfo = (uid) => {
    const vcid = uid;
    let user = null;
    Object.keys(this.userList).forEach((key) => {
      const value = this.userList[key];
      let vcuserId = md5.hex_md5(value._id);
      vcuserId = vcuserId.length > 6 ? vcuserId.substr(0, 6) : vcuserId;
      vcuserId = parseInt(vcuserId, 16);
      if (vcuserId.toString() === vcid.toString()) {
        user = value;
      }
    });
    if (user === null) {
      user = { username: 'Guest' };
    }
    return user.username;
  };

  renderRemotes = (remotes) => {
    const { visible } = this.state;
    if (!visible) {
      return (
        <View style={[styles.videoView, { zIndex: 110 }]}>
          {remotes.map((v, k) => {
            const key = `key${k}`;
            return (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => this.onPressVideo(v)}
                key={key}
                // style={}
              >
                <AgoraView
                  style={[
                    styles.remoteView,
                    {
                      borderRadius: 5,
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderWidth: 3,
                    },
                  ]}
                  zOrderMediaOverlay={true}
                  remoteUid={v}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    zIndex: 200,
                    width: 100,
                    left: 10,
                    backgroundColor: '#fff',
                  }}
                >
                  <Text> {this.getUserInfo(v)} </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    return <View style={[styles.videoView, { zIndex: 110 }]} />;
  };

  render() {
    const {
      isMute,
      // isSpeaker,
      // isCameraTorch,
      disableVideo,
      isHideButtons,
      remotes,
      isJoinSuccess,
      visible,
      swapModal,
      selectUid,
    } = this.state;

    if (!isJoinSuccess || !swapModal) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#000',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="small" color="#FFF" />
        </View>
      );
    }
    return (
      <TouchableOpacity
        activeOpacity={1}
        // onPress={this.handlerHideButtons}
        style={[styles.container]}
      >
        {(disableVideo && (
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon
              name="video-off"
              type="material-community"
              size={50}
              color="rgba(156,156,156,1)"
            />
          </View>
        )) || <AgoraView style={styles.localView} showLocalVideo={true} />}
        <View style={styles.absView}>
          {this.renderRemotes(remotes)}
          {!isHideButtons && (
            // <View>
            //   <OperateButton
            //     style={{ alignSelf: 'center', marginBottom: -10 }}
            //     onPress={this.handlerCancel}
            //     imgStyle={{ width: 60, height: 60 }}
            //     source={require('./images/btn_endcall.png')}
            //   />
            //   <View style={styles.bottomView}>
            //     <OperateButton
            //       onPress={this.handlerChangeCameraTorch}
            //       imgStyle={{ width: 40, height: 40 }}
            //       source={isCameraTorch ? require('./images/闪光灯打开.png') : require('./images/闪光灯关闭.png')}
            //     />
            //     <OperateButton
            //       onPress={this.handlerChangeVideo}
            //       source={disableVideo ? require('./images/摄像头打开.png') : require('./images/摄像头关闭.png')}
            //     />
            //   </View>
            //   <View style={styles.bottomView}>
            //     <OperateButton
            //       onPress={this.handlerMuteAllRemoteAudioStreams}
            //       source={isMute ? require('./images/icon_muted.png') : require('./images/btn_mute.png')}
            //     />
            //     <OperateButton
            //       onPress={this.handlerSwitchCamera}
            //       source={require('./images/btn_switch_camera.png')}
            //     />
            //     <OperateButton
            //       onPress={this.handlerSetEnableSpeakerphone}
            //       source={!isSpeaker ? require('./images/icon_speaker.png') : require('./images/btn_speaker.png')}
            //     />
            //   </View>
            // </View>
            <View style={[styles.bottomContainer]}>
              {!isMute && (
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Icon
                    name="microphone-off"
                    type="material-community"
                    size={50}
                    color="rgba(156,156,156,1)"
                    style={{
                      alignSelf: 'center',
                      marginBottom: 50,
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      borderRadius: 25,
                      padding: 15,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 14 }}>You are muted</Text>
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'column' }}>
                <View style={styles.bottomView}>
                  <OperateButton
                    style={styles.iconBtns}
                    icon="camera-switch"
                    iconSize={30}
                    onPress={this.handlerSwitchCamera}
                  />
                  <OperateButton
                    style={!isMute ? styles.iconBtnsOn : styles.iconBtns}
                    icon={!isMute ? 'microphone' : 'microphone-off'}
                    iconSize={30}
                    onPress={this.handlerMuteLocalAudioStream}
                  />
                  <OperateButton
                    style={disableVideo ? styles.iconBtnsOn : styles.iconBtns}
                    icon={disableVideo ? 'video' : 'video-off'}
                    iconSize={30}
                    onPress={this.handlerChangeVideo}
                  />
                </View>
                <OperateButton
                  style={styles.callEndBtn}
                  icon="phone-hangup"
                  iconSize={40}
                  iconColor="#FFF"
                  onPress={this.handlerCancel}
                />
              </View>
            </View>
          )}
        </View>
        {visible && swapModal ? (
          <Modal
            visible={visible}
            presentationStyle="fullScreen"
            animationType="fade"
            onRequestClose={() => {}}
            // style={{
            //   zIndex: 300,
            //   position: 'absolute',
            //   top: 10,
            //   bottom: 10,
            //   left: 10,
            //   right: 10,
            // }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{ flex: 1 }}
              onPress={() =>
                this.setState(
                  {
                    visible: false,
                    swapModal: false,
                  },
                  () => {
                    setTimeout(() => this.setState({ swapModal: true }), 1);
                  },
                )
              }
            >
              <AgoraView style={{ flex: 1 }} zOrderMediaOverlay={true} remoteUid={selectUid} />
            </TouchableOpacity>
          </Modal>
        ) : null}
      </TouchableOpacity>
    );
  }
}

// eslint-disable-next-line react/no-multi-comp
class OperateButton extends PureComponent {
  render() {
    // onPress, style, icon = 'circle', iconSize = 12, iconColor = '#000'
    // eslint-disable-next-line react/prop-types
    const { onPress, style, icon = 'circle', iconSize = 12, iconColor = '#000' } = this.props;
    return (
      <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.7}>
        <Icon name={icon} type="material-community" size={iconSize} color={iconColor} />
      </TouchableOpacity>
    );
  }
}

AgoraVideoConf.defaultProps = {
  instance: 'redflock',
  groupName: 'test',
  groupID: '0',
  userID: '123',
  onPress: () => {},
  // source: 'unknown',
  // style: null,
  // imgStyle: { width: 60, height: 60 },
};

AgoraVideoConf.propTypes = {
  instance: PropTypes.string,
  groupName: PropTypes.string,
  groupID: PropTypes.string,
  userID: PropTypes.string,
  onPress: PropTypes.func,
  // source: PropTypes.string,
  // style: PropTypes.style,
  // imgStyle: PropTypes.style,
};
