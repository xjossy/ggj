#!/usr/bin/env python

import socket, threading, time
import hashlib
import base64
import fileinput
import select
import struct
import sys

waiting = False

MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
TEXT = 0x01
BINARY = 0x02
DURATION = 600

condition = threading.Condition()
g_play_socket = 0
g_edit_socket = 0

def encodeMessage(s):
  message = ""
  b1 = 0x80
  if type(s) == unicode:
    b1 |= TEXT
    payload = s.encode("UTF8")
  elif type(s) == str:
    b1 |= TEXT
    payload = s
  message += chr(b1)
  b2 = 0
  length = len(payload)
  if length < 126:
    b2 |= length
    message += chr(b2)
  elif length < (2 ** 16) - 1:
    b2 |= 126
    message += chr(b2)
    l = struct.pack(">H", length)
    message += l
  else:
    l = struct.pack(">Q", length)
    b2 |= 127
    message += chr(b2)
    message += l
  message += payload
  return message
  

def decodeCharArray(stringStreamIn): 
  byteArray = [ord(character) for character in stringStreamIn]
  datalength = byteArray[1] & 127
  indexFirstMask = 2
  if datalength == 126:
    indexFirstMask = 4
  elif datalength == 127:
    indexFirstMask = 10
  masks = [m for m in byteArray[indexFirstMask : indexFirstMask+4]]
  indexFirstDataByte = indexFirstMask + 4
  decodedChars = []
  i = indexFirstDataByte
  j = 0
  while i < len(byteArray):
    decodedChars.append( chr(byteArray[i] ^ masks[j % 4]) )
    i += 1
    j += 1
  return decodedChars


def handle(s):
  global waiting
  global g_play_socket
  global g_edit_socket

  s.setblocking(0);

  ready = select.select([s], [], [], 20)
  if not ready[0]:
    print "time out"
    try:    
      s.close()
    except:
      pass
    return

  print repr(ready)

  request = s.recv(4096).strip()

  print request

  specificationGUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
  websocketKey = ''

  lines = request.splitlines()
  for line in lines:
    args = line.partition(": ")
    if args[0] == 'Sec-WebSocket-Key':
      websocketKey = args[2]

  print websocketKey

  fullKey = hashlib.sha1(websocketKey + specificationGUID).digest()

  acceptKey = base64.b64encode(fullKey)

  response = 'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acceptKey + '\r\n\r\n'
  s.send(response)
  print response

  mode = ''
  if waiting:
    mode = 'EDIT'
    g_edit_socket = s
    waiting = False
    
    with condition:
      condition.notify()
  else:
    mode = 'PLAY'
    waiting = True
    g_play_socket = s
    while waiting:
      with condition:
        condition.wait(20)
      r = ''
      try:
        r = ''.join(decodeCharArray(s.recv(4096)))
      except: pass

      if waiting and not 'PING' in r :
        waiting = False
        s.close()
        print "ping not received"
        return
      else : print "ping received"
  print "starting game!"

  play_socket=g_play_socket
  edit_socket=g_edit_socket
  if mode=='PLAY':
    s_ = edit_socket
  if mode=='EDIT':
    s_ = play_socket

  message=encodeMessage(mode)
  s.send(str(message))
  start_time = time.time()

  while 1:
    print 'd_time = ', time.time()-start_time

    d_time = time.time()-start_time
    # if DURATION-d_time <= 0:
    #   if mode=='PLAY':
    #     m=encodeMessage('WIN')
    #     s.send(str(m))
    #     mode = 'EDIT'
    #   if mode=='EDIT':
    #     m=encodeMessage('LOSE')
    #     s.send(str(m))
    #     mode = 'PLAY'
    #   sleep(5)
    #   m=encodeMessage(mode)
    #   s.send(str(m))
    #   start_time = time.time()

    ready = select.select([s], [], [], DURATION-d_time)

    if not ready[0]:
      print "time out"
      m=encodeMessage('CLOSE')
      try:
        s.send(str(m))
        s.close()
      except:
        pass
      try:    
        s_.send(str(m))
        s_.close()
      except:
        pass
      return
    r = ''
    try:
      print "get data"
      data = s.recv(4096)
      print [ord(x) for x in data]
      if not data:
        m=encodeMessage('CLOSE')
        s_.send(str(m))
        try: s.close()
        except: pass
        return
      r = ''.join(decodeCharArray(data))

      #----
      if '\0CLOSE\xff' in r :
        s.close()
        m=encodeMessage('CLOSE')
        s_.send(str(m))
        try: s_.close()
        except: pass
        return
      # ----

      # if '\0DEAD\xff' in r :
      #   if mode=='PLAY':
      #     m=encodeMessage('WIN')
      #     s.send(str(m))
      #     mode = 'EDIT'
      #   if mode=='EDIT':
      #     m=encodeMessage('LOSE')
      #     s.send(str(m))
      #     mode = 'PLAY'
      #   sleep(5)
      #   m=encodeMessage(mode)
      #   s.send(str(m))
      #   start_time = time.time()
      else:
        print r
        if len(r)>2:
          # if r[0]=='\0':
          #   print '-------------------------- FAIL!!! ---------------'
          m=encodeMessage(r[1:-2])
          s_.send(str(m))
    except Exception as e:
      pass
      # print repr(e)
      # print sys.exc_info()[0]

s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('', 9076));
s.listen(1);

while 1:
  t,_ = s.accept();
  threading.Thread(target = handle, args = (t,)).start()

