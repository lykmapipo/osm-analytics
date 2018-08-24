import React, { Component } from 'react'
import Modal from 'react-modal'
import * as request from 'superagent'
import { queue } from 'd3-queue'
import { parse, DOM } from 'xml-parse'

const initialHowMany = 10

class SubTagsModal extends Component {
  state = {
    howMany: initialHowMany,
    loading: false
  }

  userNames = {}

  render() {
    const total = this.props.subTags.reduce((prev, subTag) => prev + subTag.count, 0)
    return (
      <Modal
        isOpen={this.props.isOpen}
        onRequestClose={this.props.onRequestClose}
        className={this.state.loading ? 'updating' : ''}
        style={this.props.style}>
        <h3>Top {Math.min(this.state.howMany, this.props.subTags.length)} Tags</h3>
        <a className="close-link" onClick={this.props.onRequestClose}>x</a>
        <ul className="subTags">
        {this.props.subTags.slice(0,this.state.howMany).map(subTag =>
          <li key={subTag.subTag}>
            <span style={{fontFamily: "monospace"}}>{this.props.tagKey}={subTag.subTag}</span>
            <span className='percentage'>{Math.round(subTag.count/total*100) || '<1'}%</span>
          </li>
        )}
          <li>{this.props.subTags.length > this.state.howMany
            ? <button onClick={::this.expand}>show more</button>
            : ''}
          </li>
        </ul>
      </Modal>
    )
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isOpen) return
    this.setState({ howMany: initialHowMany })
  }

  expand() {
    this.setState({
      howMany: this.state.howMany + initialHowMany
    })
  }
}

export default SubTagsModal
