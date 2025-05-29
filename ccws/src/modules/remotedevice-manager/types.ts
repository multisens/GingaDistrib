export enum EventType {
    attribution = 'attribution',
    preparation = 'preparation',
    presentation = 'presentation',
    selection = 'selection',
    view = 'view'
}

export enum Action {
    start = 'start',
    stop = 'stop',
    abort = 'abort',
    pause = 'pause',
    resume = 'resume'
}

export enum Transition {
    starts = 'starts',
    stops = 'stops',
    aborts = 'aborts',
    pauses = 'pauses',
    resumes = 'resumes'
}

export type NodeMetadata = {
    nodeId: string,
    nodeSrc?: string,
    appId: string,
    type: string,
    properties?: { name: string, value: string }[]
}

export type ActionMetadata = {
    nodeId: string,
    label?: string,
    appId: string,
    eventType: EventType,
    action: Action,
    value?: string,
    delay?: number
}

export type TransitionMetadata = {
    nodeId: string,
    label?: string,
    appId: string,
    eventType: EventType,
    transition: Transition,
    value?: string,
    user?: string
}