# WhatsApp Gateway API with Node.js - gRPC

## Why gRPC?
This project utilizes gRPC for its communication protocol due to its suitability for internal server implementations. Unlike REST APIs, gRPC is optimized for low latency and high performance, making it ideal for microservices architecture within closed networks.

## How to Use

**1. gRPC Endpoint**  
Connect to the gRPC server at `grpc://localhost:50055/` for all API interactions.


**2. Sending a Message**
> 
    {
        "phone_number": "XXXX",
        "message": "Here's your message"
    }

**2. Sending a Message with attachment**
>
    {
        "phone_number": "XXXX",
        "message": "Here's your message",
        "attachment": "path_to_file"
    }

Replace "XXXX" with the recipient's phone number and "path_to_file" with the actual path to the file attachment.

___   


This template provides a structured approach to help users understand and start using your WhatsApp API implementation effectively