# @dtw/files

## inspiration

Working at Amplify (https://amplify.com) for the last year and a half I've been semi pushing forward the concept of isomorphic JS and how, with a little bit of creative engineering, we can build tools that can be placed on the frontend or the backend and moved between as we see fit.

NodeJS microservices are a bit of a greenfield exercise for us in that we have engineers with experience but we don't necessarily have the libs and the tooling. My previous work has been a lot of Express when it comes to NodeJS for simplicity. It finally came to building tools that we want to fit inside our publishing pipeline and we wanted the concept of Transform Streams for maximum throughput (concurrency).

In my head, I default to thinking of files and binary data needing transformations as a stream. This comes from a little bit of background information implementing an S3 proxy of sorts using Dropwizard. We wanted to hit a Dropwizard (DW) endpoint with a set of path/query params and maybe some auth and then open a request to S3 using:

```xml
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-java-sdk</artifactId>
    <version>1.11.126</version>
</dependency>
```

and then we wanted to pass that response through to the response from the original client. I quickly found this to be extremely unproductive. I'll go back look up the code when I get a chance and create an example repository of what exactly I found. More or less, we wanted to serve PDFs of size 100MB+ and so obviously there needed to be some response/request stream "chunking" in order to do it optimally and the overhead around the Jersey "InputStream" class wasn't quite working for my needs and was terribly slow.

Fast forwarding ahead a bit, I got into some discussions with my friend [Adnane Ouahabi](https://www.linkedin.com/in/ouahabi/?originalSubdomain=es) at [Glovo](https://www.linkedin.com/company/glovo-app/) talking about event based architecture for all the Glovo services backed by Java based microservices, [Apache Avro](https://avro.apache.org/) and [Amazon Kineses](https://aws.amazon.com/kinesis/). More or less the discussion was centered around leaving the least amount of information in buffer/memory as possible. When it comes to the static/publishing content of Amplify (think books) I felt that this would be an amazing optimization if we could get it done right. Think about more S3 (cloud storage) and less networking. This means that we could build a pipeline of transforms and pipe data to said microservices with a destination location (maybe a bucket) and do all our publishing in one go. This would also centralize our storage space.

inputs -> streams -> transforms -> responses -> storage

![](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Simple-bipartite-graph.svg/1920px-Simple-bipartite-graph.svg.png)

In the same vein, we'd have a bipartite graph of inputs and outputs with a graph network of the journey in between. For example, any big publisher or magazine company or CMS system would have very similar context.

1. author/journalist (any sort of writer) writes content in a system
2. system automatically exports to print and web
3. both print and web have similar contexts so store in the same location to keep track of underlying derivative

This concept of Kinesis is where this repo comes in. We have PDFs we're downloading from Google Drive slides that we want to run through [Ghostscript](https://www.ghostscript.com/) for optimization purposes (reduce size and compress binary bundled information) and then we want to be able to split the PDF by page and upload all these new pdfs to more or less the same location.

Google Drive slides -> pdf export -> ghostscript -> hummus -> S3

Well, at the same time, we want to "cache" the PDF by an internal version number (https://developers.google.com/drive/api/v3/reference/files#resource) from the export such that we have the raw PDF we can always go back and re-transform when we need to.

My brain immediately goes to optimizations because that's why I love my computer science job and that means that I want to be able to task-ify as many iterations of this pipe as possible as an async style pipeline.

cache === stream passthrough/forward response as received to S3
pdf transform === stream -> I/O -> ghostscript -> I/O -> stream to S3

Then my mind immediately went one other location because there's one other use case. What if in the microservice we want to process the file as the whole buffer or chunks of the stream aggregated? Then we'd want stream or a buffer or directly to I/O and then we'd want to interchange between all of those as needed.

## dependencies

[Ghostscript](https://www.ghostscript.com/)
- https://formulae.brew.sh/formula/ghostscript#default
- main this is to alias it to `gs` in your `$PATH` or else the PDF opt will error out