import React, { Component } from 'react';
import dingtalk from 'dingtalk-javascript-sdk';
import {Modal,Toast,NavBar,Icon,List,Button,InputItem,Checkbox,ActivityIndicator} from 'antd-mobile';
import axios from 'axios';
import qs from 'querystring';
import Utils from './utils';

const Item = List.Item;
const CheckboxItem = Checkbox.CheckboxItem;

const basepath = '/home/';
const networkFail='Network connection failed !!!';
let checkedProject=[];
let maxCount=0;
let canAdd = false;

class App extends Component {
  constructor(props){
    super(props);
    this.state={
      visible:false,
      display:1,
      userProjectData:[],
      annualProjectData:[],
      typeData:[],
      projectData:[],
      userProjectId:0,
      annualProjectId:0,
      typeId:0,
      animating:true,
      visibleModal:false,
      laborHour:'',
      dateMsg:''
    };
  }

  componentWillMount(){
    canAdd = false;
    if(!dingtalk.ready||typeof(dingtalk.ready)!=='function'){
      this.setAnimatingFalse();
      Toast.fail('非钉钉环境，不支持！');
      return false;
    }else{
      this.dingtalkAuthentication();
    }
  }

  setAnimatingFalse=()=>{
    this.setState({animating:false})
  }

  dingtalkAuthentication=()=>{
    axios.get(basepath+'dingtalkAuthentication?T='+new Date().getTime())
    .then(res=>{
      if(!res.data){
        this.setAnimatingFalse();
        Toast.offline(networkFail);
        return false;
      }
      if(res.data.code!=200){
        this.setAnimatingFalse();
        Toast.fail(res.data.msg);
        return false;
      }
      maxCount = res.data.value;
      this.dingTalkConfig(res.data.entity,this.loadUserProjectData,this.setAnimatingFalse);
    })
  }

  dingTalkConfig = (obj,callback,callback1) => {
     /*  dingtalk.config({
        agentId : obj.agentId,
        corpId : obj.corpId,
        timeStamp : obj.timeStamp,
        nonceStr : obj.nonceStr,
        signature : obj.signature,
        jsApiList : []
      }); */
      dingtalk.ready(function () {
          const dd = dingtalk.apis;
          dd.runtime.permission.requestAuthCode({
              corpId: obj.corpId,
              agentId:obj.agentId,
              onSuccess: function (authCode) {
                //alert('钉钉鉴权====code=' + authCode.code)
                callback(authCode.code);
              },
              onFail: function (err) {
                const ua = navigator.userAgent;
                const iOS = /iPad|iPhone|iPod/.test(ua);
                if(!iOS){
                  Toast.fail("从钉钉获取登录码错误：" + JSON.stringify(err));
                  callback1();
                }
              }
            })
        })
        /* dingtalk.error(function(err){
          Toast.fail("dingtalk.ready执行错误：" + JSON.stringify(err));
        }) */
  }

  loadUserProjectData=(code)=>{
    axios.get(basepath+'loadUserProjectData?code='+code+'&T='+new Date().getTime())
    .then(res=>{
      if(!res.data){
        Toast.offline(networkFail);
        this.setAnimatingFalse();
        return false;
      }
      if(res.data.code!=200){
        Toast.fail(res.data.msg);
        this.setAnimatingFalse();
        return false;
      }
      if(code!=-1){
        canAdd = true;
      }
      this.setState({
        userProjectData:res.data.entity,
        dateMsg:res.data.value
      },()=>{
        this.setAnimatingFalse();
      })
    })
  }
  showModal=(item)=>{
    this.setState({
      userProjectId:item.key,
      visibleModal:true,
      laborHour:''
    })
  }

  saveLaborHour=()=>{
    const reg = new RegExp('^[0-9]+([.]{1}[0-9]{1})?$');
    const {userProjectId,laborHour} = this.state;
    if(!reg.test(laborHour)){
      Toast.info('工时为数字&最多含一位小数');
      return false;
    }
    if(Number(laborHour)>Number(maxCount)){
      Toast.info('一周工时最多'+maxCount+'小时');
      return false;
    }
    axios.get(basepath+'saveLaborHour?userProjectId='+userProjectId+'&laborHour='+laborHour+'&T='+new Date().getTime())
    .then(res=>{
      if(!res.data){
        Toast.offline(networkFail);
        return false;
      }
      if(res.data.code!=200){
        Toast.fail(res.data.msg);
        return false;
      }
      Toast.success(res.data.msg);
      this.setState({
        visibleModal:false,
      })
      this.loadUserProjectData(-1);
    })
  }
  
  changeDisplay=(key)=>{
   
    let display=this.state.display;
    display=display+1;
    if(display===2){
      if(this.state.animating){
        Toast.info("正在钉钉免登，请稍等！");
        return false;
      }
      if(!canAdd){
        Toast.info("非法操作！");
        return false;
      }
      // 加载清单
      axios.get(basepath+'loadAnnualProjectData?T='+new Date().getTime())
      .then(res=>{
        if(!res.data){
          Toast.offline(networkFail);
          return false;
        }
        if(res.data.code!=200){
          Toast.fail(res.data.msg);
          return false;
        }
        this.setState({
          annualProjectData:res.data.entity,
          display,
          typeData:res.data.value,
          visible:false
        })
      })
    }
    if(display===3){
      this.setState({
        display,
        annualProjectId:key,
        visible:false
      })
    }
    if(display===4){
      checkedProject=[];
      // 加载项目
      axios.get(basepath+'loadProjectData?typeId='+key
                +'&annualProjectId='+this.state.annualProjectId+'&T='+new Date().getTime())
      .then(res=>{
        if(!res.data){
          Toast.offline(networkFail);
          return false;
        }
        if(res.data.code!=200){
          Toast.fail(res.data.msg);
          return false;
        }
        this.setState({
          projectData:res.data.entity,
          display,
          typeId:key,
          visible:false
        })
      })
    }
  }

  showBack=()=>{
    let display=this.state.display;
    display=display-1;
      this.setState({
        display
      })
  }

  onChange=(e,value)=>{
    if(e.target.checked){
      checkedProject.push(value);
    }else{
      Utils.remove(checkedProject,value)
    }
  }

  addProjects=()=>{
    axios.post(basepath+'addProjects',qs.stringify({
      projectIds:checkedProject,
      T:new Date().getTime()
    }))
    .then(res=>{
      if(!res.data){
        Toast.offline(networkFail);
        return false;
      }
      if(res.data.code!=200){
        Toast.fail(res.data.msg);
        return false;
      }
      Toast.success(res.data.msg);
      this.loadUserProjectData(-1);
      this.setState({
        display:1
      })
    })
  }


  showMenu=()=>{
    this.setState({visible:true})
  }


  render() {
    const {visible,display,userProjectData,annualProjectData,typeData,projectData,animating,visibleModal,laborHour,dateMsg}=this.state;
    return (
      <div style={{overflow:'auto'}}>
        <NavBar mode="dark" style={{position:'fixed',zIndex:10}}
            leftContent={display===1?'':
            <Icon key="1" type="left" onClick={this.showBack} size='lg'/>
          }
            rightContent={display===1?
            <Icon key="2" type="ellipsis" onClick={this.showMenu} />
            :''
          }
        >
          研发项目工时管理
        </NavBar>

        <ActivityIndicator toast text="Loading..." animating={animating} />
        
        <div className={visible?'drawer-my':'displayNone'}>
          <ul>
            <li onClick={this.changeDisplay} key="4"><i className="iconfont icon-tianjiajihua"/>添加项目</li>
          </ul>
        </div>
        {/* */}
          <div className={display===1&&!animating?'div-main':'displayNone'}>
            <List  className="list-my">
              {userProjectData.length===0?
                    <Item >你还木有项目,去添加吧! </Item>
                :userProjectData.map(item=>{
                  return(
                    <Item extra={<i className="iconfont icon-plus"/>} onClick={this.showModal.bind(this,item)} key={item.key}>
                      <p><span className='span-right'>{item.annualProjectName}</span>/<span className='span-right span-left'>{item.typeName}</span>/<span className='span-left'>{item.projectName}</span></p>
                      <p><span className='span-right'>{item.totalHour}</span>/<span className='span-left'>{item.currentHour}</span></p>
                    </Item>
                    )
                })
              }
            </List>
          </div>

          <div className={display===2?'div-main':'displayNone'}>
            <List  className="list-my">
              {annualProjectData.map(item=>{
                    return(
                      <Item extra={<Icon type="right" />} onClick={this.changeDisplay.bind(this,item.annualProjectId)} key={item.annualProjectId}>
                        <span>{item.name}</span>
                      </Item>
                    )
                  }
              )}
            </List>
          </div>

          <div className={display===3?'div-main':'displayNone'}>
            <List  className="list-my">
              {typeData.map(item=>{
                      return( 
                        <Item extra={<Icon type="right" />} onClick={this.changeDisplay.bind(this,item.projectTypeId)} key={item.projectTypeId}>
                          <span>{item.name}</span>
                        </Item>
                      )
                    }
                )}
              </List>
          </div>

          <div className={display===4?'div-main':'displayNone'}>
            <List  className="list-my">
              {projectData.map(item=>{
                return (
                  <CheckboxItem key={item.projectId} onChange={e => this.onChange(e,item.projectId)}>
                    {item.name}
                  </CheckboxItem>
                )
              })
              }
            </List>
          </div>
          <List className={display!==4||projectData.length===0?'displayNone':'list-none btn-fixed'}>
              <Button onClick={this.addProjects}  type='primary' >添加</Button>
          </List>

          <div className={visible?'overlay':''} onClick={()=>this.setState({visible:false})}/>

          <Modal visible={visibleModal} transparent={true} popup={true} title='请输入工时'
                onClose={()=>this.setState({visibleModal:false})}
                footer={[
                  {text:'取消',onPress:()=>this.setState({visibleModal:false})},
                  {text:'确定',onPress:()=>this.saveLaborHour()}
                ]}
          >
            <List className='list-none'>{dateMsg}</List>
            <List className='list-none'>
              <InputItem type='money' maxLength={4} value={laborHour} onChange={value=>this.setState({laborHour:value})} moneyKeyboardAlign ='left'/>
            </List>
          </Modal>
        
      </div>
    );
  }
}

export default App;
