#include <avr/wdt.h>

void reset(){
  Serial.println("system:reset");
  wdt_enable(WDTO_4S);
  
}

bool serialConnected = false;
long time = 0;

#define B1 A2
#define B2 A1
#define B3 10
#define B4 11

int stateB1 = 0;
int stateB2 = 0;
int stateB3 = 0;
int stateB4 = 0;

int breakB1 = 0;
int breakB2 = 0;
int breakB3 = 0;
int breakB4 = 0;

int lastStateB1 = 1;
int lastStateB2 = 1;
int lastStateB3 = 1;
int lastStateB4 = 1;

long lastPressedB1 = 0;
long lastPressedB2 = 0;
long lastPressedB3 = 0;
long lastPressedB4 = 0;

long lastPressed = 0;
int pause = 250;
int pressed = 0;
long lastCheck = 0;
int freq = 70;

String serialInput= "";
String lastCombo = "";




void setup() {
  // put your setup code here, to run once:

  pinMode(B1, INPUT_PULLUP); 
  pinMode(B2, INPUT_PULLUP);  
  pinMode(B3, INPUT_PULLUP);
  pinMode(B4, INPUT_PULLUP);

  Serial.begin(9600);
  //Serial.setTimeout(0);
  while (!Serial) {
      ; // wait for serial port to connect. Needed for native USB
  }
  Serial.println("serial connected");
}

void loop() {
  // put your main code here, to run repeatedly:
  time = millis();
  
  if( Serial.available() > 0) {
     serialInput = Serial.readString();
    if ( serialConnected == false && serialInput == "system:ready" ) {
        serialConnected = true;
        Serial.println("system:connected");
    }
    else if ( serialConnected == true && serialInput == "system:ready" ) {
        serialConnected = true;
        Serial.println("system:stillconnected");
    }
   else if ( serialConnected == true && serialInput == "system:alert:reset" ) {
        Serial.println("system:reset");
        reset();
    }
  }
    
  if ( serialConnected == true ) {

          stateB1 = digitalRead(B1);
          stateB2 = digitalRead(B2);
          stateB3 = digitalRead(B3);
          stateB4 = digitalRead(B4);
          
          if ( time > lastCheck + freq) {   
        
              if ( stateB1 == 0 && stateB1 == lastStateB1 ) breakB1 = 1;
              else breakB1 = 0;
              if ( stateB2 == 0 && stateB2 == lastStateB2 ) breakB2 = 1;
              else breakB2 = 0;
              if ( stateB3 == 0 && stateB3 == lastStateB3 ) breakB3 = 1;
              else breakB3 = 0;
              if ( stateB4 == 0 && stateB4 == lastStateB4 ) breakB4 = 1;   
              else breakB4 = 0;
        
              
              pressed = stateB1 + stateB2 + stateB3 + stateB4;
              String output = String(stateB1) + String(stateB2) + String(stateB3) + String(stateB4);
              
              int breaks = breakB1 + breakB2 + breakB3 + breakB4;
              
              if ( time > lastPressed + pause && pressed < 4 && breaks == 0) {
                
                if ( output != lastCombo || time > lastPressed + ( 300 * pause ) ) {
                  Serial.println(String("buttons:" + output));
                  lastPressed = time;
                }
        
             }
             lastStateB1 = stateB1;
             lastStateB2 = stateB2;
             lastStateB3 = stateB3;
             lastStateB4 = stateB4;
             lastCombo = output;
             
             lastCheck = time;
             
          }
      
   }
    
    
}
