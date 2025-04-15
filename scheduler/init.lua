local mqtt = require('mqtt')

LINKS = {}
APPID = 0

local client = mqtt.client{ uri = 'localhost', username = 'scheduler', clean = true}
print('MQTT Scheduler created')


function addLink(cond, act)
  LINKS[parseCondition(cond)] = act;
end

function generateStructure(topic)
  local s = 'tv/apps/:appId/doc/:nodeId'
  if string.find(topic, '/interfaces/') ~= nil then
    s = s .. '/interfaces/:label'
  end
  s = s .. '/:eventType/:notification'

  return topic, s
end

function parseTopic(topic, topicStructure)
  local structure = {}
  for part in string.gmatch(topicStructure, "[^/]+") do
      table.insert(structure, part)
  end
  
  local parts = {}
  for part in string.gmatch(topic, "[^/]+") do
      table.insert(parts, part)
  end
  
  if #parts ~= #structure then
      error("Topic does not match expected structure")
  end

  local result = {}
  for i = 1, #structure do
      if string.sub(structure[i], 1, 1) == ":" then
          -- It's a parameter
          local paramName = string.sub(structure[i], 2)
          result[paramName] = parts[i]
      elseif structure[i] ~= parts[i] then
          error("Topic segment mismatch at position " .. tostring(i-1))
      end
  end

  return result
end

function parseEvent(ntf, val)
  local evt = {}
  evt.eventType = (ntf.eventType):gsub('%Event', '')
  evt.nodeId = ntf.nodeId
  evt.label = ntf.label
  evt.transition = val

  return evt
end

function parseCondition(cond)
  local c = cond.nodeId
  if cond.label then c = c .. '.' .. cond.label end
  c = c .. '.' .. cond.eventType .. '.' .. cond.transition
  return c
end

function generateTopic(act, suffix)
  local s = 'tv/apps/' .. APPID .. '/doc/' .. act.nodeId
  if act.label then
    s = s .. '/interfaces/' .. act.label
  end
  s = s .. '/' .. act.eventType .. 'Event/' .. suffix

  return s
end

function schedule(evt)
  local t

  -- Update node data in broker
  t = generateTopic(evt, 'state')
  local s = 'sleeping'
  if evt.transition == 'starts' or evt.transition == 'resumes' then s = 'occurring' end
  if evt.transition == 'pauses' then s = 'paused' end
  client:publish{ topic = t, payload = s, qos = 1, retain = true }

  local act = LINKS[parseCondition(evt)]
  if act == nil then return end

  t = generateTopic(act, 'actionNotification')
  client:publish{ topic = t, payload = act.action, qos = 1 }
end


client:on{
  connect = function (connack)
    if connack.rc ~= 0 then
      print('Connection failed')
      return
    end

    client:subscribe{ topic = 'tv/apps/currentApp', qos = 1 }
  end,

  message = function (msg)
    client:acknowledge(msg)

    if msg.topic == 'tv/apps/currentApp' then
      APPID = msg.payload
      client:subscribe{ topic = 'tv/apps/' .. APPID ..'/doc/#', qos = 1 }
    else
      local t = parseTopic(generateStructure(msg.topic))
      if t.appId == APPID and t.notification == 'eventNotification' then
        schedule(parseEvent(t, msg.payload))
      end
    end
  end
}


-- Document links
-- addLink({ nodeId = 'scene360', eventType = 'preparation', transition = 'starts' },
--         { nodeId = 'scene360', eventType = 'preparation', action = 'stops' })

addLink({ nodeId = 'scene360', eventType = 'preparation', transition = 'stops' },
        { nodeId = 'scene360', eventType = 'presentation', action = 'starts' })




mqtt.run_ioloop(client)